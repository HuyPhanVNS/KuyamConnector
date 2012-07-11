(function ($, undefined) {

    // Imports ================================================================
    var doc = document,
        $t = $.telerik,
        Class = $t.Class,
        Widget = $t.Component,
        DataSource = $t.DataSource,
        baseTemplate = $t.template,
        format = function() { return $t.formatString.apply($t, arguments); },
        map = $.map,
        grep = $.grep,
        each = $.each,
        math = Math,
        proxy = $.proxy,
        getter = $t.getter,
        extend = $.extend,
        trigger = $t.trigger,
        DATA_BINDING = "dataBinding";

    var template = function(template) {
        var paramName = "d",
            useWithBlock = false,
            functionBody = "var o,e=$.telerik.htmlEncode;",
            encodeRegExp = /\${([^}]*)}/g,
            parts,
            part,
            idx;

        if ($.isFunction(template)) {
            if (template.length === 2) {
                //looks like jQuery.template
                return function(d) {
                    return template($, { data: d }).join("");
                }
            }
            return template;
        }

        functionBody += useWithBlock ? "with(" + paramName + "){" : "";

        functionBody += "o=";

        parts = template
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t')
            .replace(encodeRegExp, "#=e($1)#")
            .replace(/\\#/g, "__SHARP__")
            .split("#");

        for (idx = 0; idx < parts.length; idx ++) {
            part = parts[idx];

            if (idx % 2 === 0) {
                functionBody += "\'" + part.split("'").join("\\'") + "'";
            } else {
                if (part.charAt(0) === "=") {
                        functionBody += "+(" + part.substring(1) + ")+";
                } else {
                    functionBody += ";" + part + ";o+=";
                }
            }
        }

        functionBody += useWithBlock ? ";}" : ";";

        functionBody += "return o;";

        functionBody = functionBody.replace(/__SHARP__/g, '#');

        return new Function(paramName, functionBody);
    }

    // Constants ==============================================================
    var ABOVE = "above",
        ANIMATION_STEP = 10,
        AREA = "area",
        BASELINE_MARKER_SIZE = 1,
        BAR = "bar",
        BAR_BORDER_BRIGHTNESS = 0.8,
        BAR_GAP = 1.5,
        BAR_SPACING = 0.4,
        BELOW = "below",
        BLACK = "#000",
        BOTTOM = "bottom",
        CENTER = "center",
        CHANGE = "change",
        CIRCLE = "circle",
        CLICK = "click",
        CLIP = "clip",
        COLUMN = "column",
        COORD_PRECISION = 3,
        DATABOUND = "dataBound",
        DEFAULT_FONT = "12px sans-serif",
        DEFAULT_HEIGHT = 400,
        DEFAULT_PRECISION = 6,
        DEFAULT_WIDTH = 600,
        DEGREE = math.PI / 180,
        FADEIN = "fadeIn",
        GLASS = "glass",
        HEIGHT = "height",
        HORIZONTAL = "horizontal",
        ID_PREFIX = "k",
        INITIAL_ANIMATION_DURATION = 600,
        INSIDE_BASE = "insideBase",
        INSIDE_END = "insideEnd",
        INTERPOLATE = "interpolate",
        LEFT = "left",
        LINE = "line",
        LINE_MARKER_SIZE = 8,
        LINEAR = "linear",
        MAX_VALUE = Number.MAX_VALUE,
        MIN_VALUE = -Number.MAX_VALUE,
        MOUSEMOVE_TRACKING = "mousemove.tracking",
        MOUSEOVER = "mouseover",
        NONE = "none",
        OBJECT = "object",
        ON_MINOR_TICKS = "onMinorTicks",
        OUTSIDE = "outside",
        OUTSIDE_END = "outsideEnd",
        OUTLINE_SUFFIX = "_outline",
        PIE = "pie",
        PIE_SECTOR_ANIM_DELAY = 70,
        PRIMARY = "primary",
        RADIAL = "radial",
        RIGHT = "right",
        ROUNDED_BEVEL = "roundedBevel",
        SCATTER = "scatter",
        SCATTER_LINE = "scatterLine",
        SERIES_CLICK = "seriesClick",
        SQUARE = "square",
        SWING = "swing",
        TOP = "top",
        TOOLTIP_ANIMATION_DURATION = 150,
        TOOLTIP_OFFSET = 5,
        TOOLTIP_SHOW_DELAY = 100,
        TRIANGLE = "triangle",
        UNDEFINED = "undefined",
        VERTICAL = "vertical",
        VERTICAL_LINE = "verticalLine",
        VERTICAL_AREA = "verticalArea",
        WIDTH = "width",
        WHITE = "#fff",
        X = "x",
        Y = "y",
        ZERO = "zero",
        ZERO_THRESHOLD = 0.2;

    var CATEGORICAL_CHARTS = [BAR, COLUMN, LINE, VERTICAL_LINE, AREA, VERTICAL_AREA],
        XY_CHARTS = [SCATTER, SCATTER_LINE];

    // Chart ==================================================================
    var Chart = Widget.extend({
        init: function(element, userOptions) {
            var chart = this,
                options,
                themeOptions,
                theme;

            Widget.fn.init.call(chart, element);
            options = deepExtend({}, chart.options, userOptions);

            theme = options.theme;
            themeOptions = theme ? Chart.themes[theme] || Chart.themes[theme.toLowerCase()] : {};

            applyDefaults(options, themeOptions);

            chart.options = deepExtend({}, themeOptions, options);

            applySeriesColors(chart.options);

            chart.bind([
                DATABOUND,
                SERIES_CLICK
            ], chart.options);

            $(element).addClass("k-chart");

            if (userOptions && userOptions.dataSource) {
                chart.dataSource = DataSource
                    .create(userOptions.dataSource)
                    .bind(CHANGE, proxy(chart._onDataChanged, chart));

                if (options.autoBind) {
                    chart.dataSource.fetch();
                }
            }

            chart._redraw();
            chart._attachEvents();
        },

        options: {
            name: "Chart",
            chartArea: {},
            title: {
                visible: true
            },
            legend: {
                visible: true
            },
            valueAxis: {
                type: "Numeric"
            },
            categoryAxis: {
                categories: []
            },
            autoBind: true,
            seriesDefaults: {
                type: COLUMN,
                data: [],
                bar: {
                    gap: BAR_GAP,
                    spacing: BAR_SPACING
                },
                column: {
                    gap: BAR_GAP,
                    spacing: BAR_SPACING
                },
                line: {
                    width: 4
                },
                labels: {}
            },
            series: [],
            tooltip: {
                visible: false
            },
            transitions: true
        },

        refresh: function() {
            var chart = this;

            applyDefaults(chart.options);

            if (chart.dataSource) {
                chart.dataSource.read();
            } else {
                chart._redraw();
            }
        },

        redraw: function() {
            var chart = this;

            applyDefaults(chart.options);

            chart._redraw();
        },

        _redraw: function() {
            var chart = this,
                options = chart.options,
                element = chart.element,
                model = chart._model = chart._getModel(),
                plotArea = chart._plotArea = model._plotArea,
                viewClass = chart._supportsSVG() ? Chart.SVGView : Chart.VMLView,
                view = chart._view = viewClass.fromModel(model);

            element.css("position", "relative");
            chart._viewElement = view.renderTo(element[0]);
            chart._tooltip = new Tooltip(element, options.tooltip);
            chart._highlight = new Highlight(view, chart._viewElement);
        },

        svg: function() {
            var model = this._getModel(),
                view = Chart.SVGView.fromModel(model);

            return view.render();
        },

        _getModel: function() {
            var chart = this,
                options = chart.options,
                element = chart.element,
                model = new RootElement(deepExtend({
                    width: element.width() || DEFAULT_WIDTH,
                    height: element.height() || DEFAULT_HEIGHT,
                    transitions: options.transitions
                    }, options.chartArea)),
                plotArea;

            if (options.title && options.title.visible && options.title.text) {
                model.append(new Title(options.title));
            }

            plotArea = model._plotArea = chart._createPlotArea();
            if (options.legend.visible) {
                model.append(new Legend(plotArea.options.legend));
            }
            model.append(plotArea);
            model.reflow();

            return model;
        },

        _createPlotArea: function() {
            var chart = this,
                options = chart.options,
                series = options.series,
                i,
                length = series.length,
                currentSeries,
                categoricalSeries = [],
                xySeries = [],
                pieSeries = [],
                plotArea;

            for (i = 0; i < length; i++) {
                currentSeries = series[i];

                if (inArray(currentSeries.type, CATEGORICAL_CHARTS)) {
                    categoricalSeries.push(currentSeries);
                } else if (inArray(currentSeries.type, XY_CHARTS)) {
                    xySeries.push(currentSeries);
                } else if (currentSeries.type === PIE) {
                    pieSeries.push(currentSeries);
                }
            }

            if (pieSeries.length > 0) {
                plotArea = new PiePlotArea(pieSeries, options);
            } else if (xySeries.length > 0) {
                plotArea = new XYPlotArea(xySeries, options);
            } else {
                plotArea = new CategoricalPlotArea(categoricalSeries, options);
            }

            return plotArea;
        },

        // Needs to be overridable in tests
        _supportsSVG: supportsSVG,

        _attachEvents: function() {
            var chart = this,
                element = chart.element;

            element.bind(CLICK, proxy(chart._click, chart));
            element.bind(MOUSEOVER, proxy(chart._mouseOver, chart));
        },

        _getPoint: function(e) {
            var chart = this,
                model = chart._model,
                coords = chart._eventCoordinates(e),
                targetId = e.target.id,
                chartElement = model.idMap[targetId],
                metadata = model.idMapMetadata[targetId],
                point;

            if (chartElement) {
                if (chartElement.getNearestPoint && metadata) {
                    point = chartElement.getNearestPoint(coords.x, coords.y, metadata.seriesIx);
                } else {
                    point = chartElement;
                }
            }

            return point;
        },

        _eventCoordinates: function(e) {
            var element = this.element,
                offset = element.offset(),
                paddingLeft = parseInt(element.css("paddingLeft"), 10),
                paddingTop = parseInt(element.css("paddingTop"), 10),
                win = $(window);

            return({
                x: e.clientX - offset.left - paddingLeft + win.scrollLeft(),
                y: e.clientY - offset.top - paddingTop + win.scrollTop()
            });
        },

        _click: function(e) {
            var chart = this,
                point = chart._getPoint(e);

            if (point) {
                chart.trigger(SERIES_CLICK, {
                    value: point.value,
                    category: point.category,
                    series: point.series,
                    dataItem: point.dataItem,
                    element: $(e.target)
                });
            }
        },

        _mouseOver: function(e) {
            var chart = this,
                tooltip = chart._tooltip,
                highlight = chart._highlight,
                tooltipOptions,
                point;

            if (!highlight || highlight.element === e.target) {
                return;
            }

            point = chart._getPoint(e);
            if (point) {
                chart._activePoint = point;
                tooltipOptions = deepExtend({}, chart.options.tooltip, point.options.tooltip);
                if (tooltipOptions.visible) {
                    tooltip.show(point);
                }

                highlight.show(point);

                $(doc.body).bind(MOUSEMOVE_TRACKING, proxy(chart._mouseMove, chart));
            }
        },

        _mouseMove: function(e) {
            var chart = this,
                tooltip = chart._tooltip,
                highlight = chart._highlight,
                coords = chart._eventCoordinates(e),
                point = chart._activePoint,
                tooltipOptions,
                owner,
                seriesPoint;

            if (chart._plotArea.box.containsPoint(coords.x, coords.y)) {
                if (point && (point.series.type === LINE || point.series.type === AREA)) {
                    owner = point.owner;
                    seriesPoint = owner.getNearestPoint(coords.x, coords.y, point.seriesIx);
                    if (seriesPoint && seriesPoint != point) {
                        chart._activePoint = seriesPoint;

                        tooltipOptions = deepExtend({}, chart.options.tooltip, point.options.tooltip);
                        if (tooltipOptions.visible) {
                            tooltip.show(seriesPoint);
                        }
                        highlight.show(seriesPoint);
                    }
                }
            } else {
                $(doc.body).unbind(MOUSEMOVE_TRACKING);

                delete chart._activePoint;
                tooltip.hide();
                highlight.hide();
            }
        },

        _onDataChanged: function() {
            var chart = this,
                options = chart.options,
                series = options.series,
                categoryAxis = options.categoryAxis,
                data = chart.dataSource.view(),
                row,
                category,
                currentSeries,
                value;

            for (var seriesIdx = 0, seriesLength = series.length; seriesIdx < seriesLength; seriesIdx++) {
                currentSeries = series[seriesIdx];
                if (currentSeries.field || (currentSeries.xField && currentSeries.yField)) {
                    currentSeries.data = [];
                    currentSeries.dataItems = [];
                }
            }

            for (var dataIdx = 0, dataLength = data.length; dataIdx < dataLength; dataIdx++) {
                row = data[dataIdx];

                if (categoryAxis.field) {
                    category = getField(categoryAxis.field, row);
                    if (dataIdx === 0) {
                        categoryAxis.categories = [category];
                    } else {
                        categoryAxis.categories.push(category);
                    }
                }

                for (var seriesIdx = 0, seriesLength = series.length; seriesIdx < seriesLength; seriesIdx++) {
                    currentSeries = series[seriesIdx];

                    if (currentSeries.field) {
                        value = getField(currentSeries.field, row);
                    } else if (currentSeries.xField && currentSeries.yField) {
                        value = [getField(currentSeries.xField, row),
                                 getField(currentSeries.yField, row)];
                    } else {
                        value = undefined;
                    }

                    if (defined(value)) {
                        if (dataIdx === 0) {
                            currentSeries.data = [value];
                            currentSeries.dataItems = [row];
                        } else {
                            currentSeries.data.push(value);
                            currentSeries.dataItems.push(row);
                        }
                    }
                }
            }

            chart.trigger(DATABOUND);
            chart._redraw();
        }
    });


    // **************************
    // View Model
    // **************************
    var Point2D = Class.extend({
        init: function(x, y) {
            var point = this;
            point.x = round(x, COORD_PRECISION);
            point.y = round(y, COORD_PRECISION);
        }
    });

    var Box2D = Class.extend({
        init: function(x1, y1, x2, y2) {
            var box = this;
            box.x1 = x1 || 0;
            box.x2 = x2 || 0;
            box.y1 = y1 || 0;
            box.y2 = y2 || 0;
        },

        width: function() {
            return this.x2 - this.x1;
        },

        height: function() {
            return this.y2 - this.y1;
        },

        translate: function(dx, dy) {
            var box = this;

            box.x1 += dx;
            box.x2 += dx;
            box.y1 += dy;
            box.y2 += dy;

            return box;
        },

        move: function(x, y) {
            var box = this,
                height = box.height(),
                width = box.width();

            box.x1 = x;
            box.y1 = y;
            box.x2 = box.x1 + width;
            box.y2 = box.y1 + height;

            return box;
        },

        wrap: function(targetBox) {
            var box = this;

            box.x1 = math.min(box.x1, targetBox.x1);
            box.y1 = math.min(box.y1, targetBox.y1);
            box.x2 = math.max(box.x2, targetBox.x2);
            box.y2 = math.max(box.y2, targetBox.y2);

            return box;
        },

        snapTo: function(targetBox, axis) {
            var box = this;

            if (axis == X || !axis) {
                box.x1 = targetBox.x1;
                box.x2 = targetBox.x2;
            }

            if (axis == Y || !axis) {
                box.y1 = targetBox.y1;
                box.y2 = targetBox.y2;
            }

            return box;
        },

        alignTo: function(targetBox, edge) {
            var box = this,
                height = box.height(),
                width = box.width(),
                axis = edge == TOP || edge == BOTTOM ? Y : X,
                offset = axis == Y ? height : width;

            if (edge == TOP || edge == LEFT) {
                box[axis + 1] = targetBox[axis + 1] - offset;
            } else {
                box[axis + 1] = targetBox[axis + 2];
            }

            box.x2 = box.x1 + width;
            box.y2 = box.y1 + height;

            return box;
        },

        shrink: function(dw, dh) {
            var box = this;

            box.x2 -= dw;
            box.y2 -= dh;

            return box;
        },

        expand: function(dw, dh) {
            this.shrink(-dw, -dh);
            return this;
        },

        pad: function(padding) {
            var box = this,
                spacing = getSpacing(padding);

            box.x1 -= spacing.left;
            box.x2 += spacing.right;
            box.y1 -= spacing.top;
            box.y2 += spacing.bottom;

            return box;
        },

        unpad: function(padding) {
            var box = this,
                spacing = getSpacing(padding);

            spacing.left = -spacing.left;
            spacing.top = -spacing.top;
            spacing.right = -spacing.right;
            spacing.bottom = -spacing.bottom;

            return box.pad(spacing);
        },

        clone: function() {
            var box = this;

            return new Box2D(box.x1, box.y1, box.x2, box.y2);
        },

        center: function() {
            var box = this;

            return {
                x: box.x1 + box.width() / 2,
                y: box.y1 + box.height() / 2
            };
        },

        containsPoint: function(x, y) {
            var box = this;

            return x >= box.x1 && x <= box.x2 &&
                   y >= box.y1 && y <= box.y2;
        },

        points: function() {
            var box = this;

            return [
                new Point2D(box.x1, box.y1),
                new Point2D(box.x2, box.y1),
                new Point2D(box.x2, box.y2),
                new Point2D(box.x1, box.y2)
            ];
        }
    });

    var Sector = Class.extend({
        init: function(c, r, startAngle, angle) {
            var sector = this;

            sector.c = c;
            sector.r = r;
            sector.startAngle = startAngle;
            sector.angle = angle;
        },

        clone: function() {
            var s = this;
            return new Sector(s.c, s.r, s.startAngle, s.angle);
        },

        expand: function(value) {
            this.r += value;
            return this;
        },

        middle: function() {
            return this.startAngle + this.angle / 2;
        },

        radius: function(newRadius) {
            this.r = newRadius;
            return this;
        },

        point: function(angle) {
            var sector = this,
                radianAngle = angle * DEGREE,
                ax = math.cos(radianAngle),
                ay = math.sin(radianAngle),
                x = sector.c.x - (ax * sector.r),
                y = sector.c.y - (ay * sector.r);

            return new Point2D(x, y);
        }
    });

    var ChartElement = Class.extend({
        init: function(options) {
            var element = this;
            element.children = [];

            element.options = deepExtend({}, element.options, options);
        },

        reflow: function(targetBox) {
            var element = this,
                children = element.children,
                box,
                i,
                currentChild;

            for (i = 0; i < children.length; i++) {
                currentChild = children[i];

                currentChild.reflow(targetBox);
                box = box ? box.wrap(currentChild.box) : currentChild.box.clone();
            }

            element.box = box;
        },

        getViewElements: function(view) {
            var element = this,
                viewElements = [],
                children = element.children,
                childrenCount = children.length;

            for (var i = 0; i < childrenCount; i++) {
                viewElements.push.apply(viewElements,
                    children[i].getViewElements(view));
            }

            return viewElements;
        },

        registerId: function(id, metadata) {
            var element = this,
                root;

            root = element.getRoot();
            if (root) {
                root.idMap[id] = element;
                if (metadata) {
                    root.idMapMetadata[id] = metadata;
                }
            }
        },

        translateChildren: function(dx, dy) {
            var element = this,
                children = element.children,
                childrenCount = children.length,
                i;

            for (i = 0; i < childrenCount; i++) {
                children[i].box.translate(dx, dy);
            }
        },

        append: function() {
            var element = this,
                i,
                length = arguments.length;

            append(element.children, arguments);

            for (i = 0; i < length; i++) {
                arguments[i].parent = element;
            }
        },

        getRoot: function() {
            var element = this,
                parent = element.parent;

            return parent ? parent.getRoot() : null;
        }
    });

    var RootElement = ChartElement.extend({
        init: function(options) {
            var root = this;

            root.idMap = {};
            root.idMapMetadata = {};

            ChartElement.fn.init.call(root, options);
        },

        options: {
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT,
            background: WHITE,
            border: {
                color: BLACK,
                width: 0
            },
            margin: getSpacing(5),
            zIndex: -1
        },

        reflow: function() {
            var root = this,
                options = root.options,
                children = root.children,
                currentBox = new Box2D(0, 0, options.width, options.height);

            root.box = currentBox.unpad(options.margin);

            for (var i = 0; i < children.length; i++) {
                children[i].reflow(currentBox);
                currentBox = boxDiff(currentBox, children[i].box);
            }
        },

        getViewElements: function(view) {
            var root = this,
                options = root.options,
                border = options.border || {},
                box = root.box.clone().pad(options.margin).unpad(border.width),
                elements = [
                        view.createRect(box, {
                            stroke: border.width ? border.color : "",
                            strokeWidth: border.width,
                            dashType: border.dashType,
                            fill: options.background,
                            zIndex: options.zIndex })
                    ];

            return elements.concat(
                ChartElement.fn.getViewElements.call(root, view)
            );
        },

        getRoot: function() {
            return this;
        }
    });

    var BoxElement = ChartElement.extend({
        init: function(options) {
            ChartElement.fn.init.call(this, options);
        },

        options: {
            align: LEFT,
            vAlign: TOP,
            margin: {},
            padding: {},
            border: {
                color: BLACK,
                width: 0
            },
            background: "",
            width: 0,
            height: 0,
            visible: true
        },

        reflow: function(targetBox) {
            var element = this,
                box,
                contentBox,
                options = element.options,
                children = element.children,
                margin = getSpacing(options.margin),
                padding = getSpacing(options.padding),
                border = options.border,
                borderWidth = border.width;

            ChartElement.fn.reflow.call(element, targetBox);

            if (children.length === 0) {
                box = element.box = new Box2D(0, 0, options.width, options.height);
            } else {
                box = element.box;
            }

            contentBox = element.contentBox = box.clone();

            box.pad(padding).pad(borderWidth).pad(margin);

            element.align(targetBox, X, options.align);
            element.align(targetBox, Y, options.vAlign);

            element.paddingBox = box.clone().unpad(margin).unpad(borderWidth);

            element.translateChildren(
                box.x1 - contentBox.x1 + margin.left + borderWidth + padding.left,
                box.y1 - contentBox.y1 + margin.top + borderWidth + padding.top);
        },

        align: function(targetBox, axis, alignment) {
            var element = this,
                box = element.box,
                c1 = axis + 1,
                c2 = axis + 2,
                sizeFunc = axis === X ? WIDTH : HEIGHT,
                size = box[sizeFunc]();

            if (inArray(alignment, [LEFT, TOP])) {
                box[c1] = targetBox[c1];
                box[c2] = box[c1] + size;
            } else if (inArray(alignment, [RIGHT, BOTTOM])) {
                box[c2] = targetBox[c2];
                box[c1] = box[c2] - size;
            } else if (alignment == CENTER) {
                box[c1] = targetBox[c1] + (targetBox[sizeFunc]() - size) / 2;
                box[c2] = box[c1] + size;
            }
        },

        hasBox: function() {
            var options = this.options;
            return options.border.width || options.background;
        },

        getViewElements: function(view, renderOptions) {
            var boxElement = this,
                options = boxElement.options;

            if (!options.visible) {
                return [];
            }

            var border = options.border || {},
                elements = [];

            if (boxElement.hasBox()) {
                elements.push(
                    view.createRect(boxElement.paddingBox, deepExtend({
                        id: options.id,
                        stroke: border.width ? border.color : "",
                        strokeWidth: border.width,
                        dashType: border.dashType,
                        strokeOpacity: options.opacity,
                        fill: options.background,
                        fillOpacity: options.opacity,
                        animation: options.animation,
                        zIndex: options.zIndex
                    }, renderOptions))
                );
            }

            return elements.concat(
                ChartElement.fn.getViewElements.call(boxElement, view)
            );
        }
    });

    var Text = ChartElement.extend({
        init: function(content, options) {
            var text = this;

            ChartElement.fn.init.call(text, options);

            // Calculate size
            text.content = content;
            text.reflow(new Box2D());
        },

        options: {
            font: DEFAULT_FONT,
            color: BLACK,
            align: LEFT,
            vAlign: ""
        },

        reflow: function(targetBox) {
            var text = this,
                options = text.options,
                size = options.size = measureText(
                                        text.content,
                                        { font: options.font },
                                        options.rotation);

            text.baseline = size.baseline;

            if (options.align == LEFT) {
                text.box = new Box2D(
                    targetBox.x1, targetBox.y1,
                    targetBox.x1 + size.width, targetBox.y1 + size.height);
            } else if (options.align == RIGHT) {
                text.box = new Box2D(
                    targetBox.x2 - size.width, targetBox.y1,
                    targetBox.x2, targetBox.y1 + size.height);
            } else if (options.align == CENTER) {
                var margin = (targetBox.width() - size.width) / 2;
                text.box = new Box2D(
                    round(targetBox.x1 + margin, COORD_PRECISION), targetBox.y1,
                    round(targetBox.x2 - margin, COORD_PRECISION), targetBox.y1 + size.height);
            }

            if (options.vAlign == CENTER) {
                var margin = (targetBox.height() - size.height) /2;
                text.box = new Box2D(
                    text.box.x1, targetBox.y1 + margin,
                    text.box.x2, targetBox.y2 - margin);
            } else if (options.vAlign == BOTTOM) {
                text.box = new Box2D(
                    text.box.x1, targetBox.y2 - size.height,
                    text.box.x2, targetBox.y2);
            } else if (options.vAlign == TOP) {
                text.box = new Box2D(
                    text.box.x1, targetBox.y1,
                    text.box.x2, targetBox.y1 + size.height);
            }
        },

        getViewElements: function(view) {
            var text = this,
                options = text.options;

            ChartElement.fn.getViewElements.call(this, view);

            return [
                view.createText(text.content,
                    deepExtend({}, options, {
                        x: text.box.x1, y: text.box.y1,
                        baseline: text.baseline
                    })
                )
            ];
        }
    });

    var TextBox = BoxElement.extend({
        init: function(content, options) {
            var textBox = this,
                text;

            BoxElement.fn.init.call(textBox, options);
            options = textBox.options;

            if (!options.template) {
                content = options.format ? format(options.format, content) : content
            }

            text = new Text(content, deepExtend({ }, options, { align: LEFT, vAlign: TOP }));
            textBox.append(text);

            if (textBox.hasBox()) {
                text.options.id = uniqueId();
            }

            // Calculate size
            textBox.reflow(new Box2D());
        }
    });

    var BarLabel = ChartElement.extend({
        init: function(content, options) {
            var barLabel = this;
            ChartElement.fn.init.call(barLabel, options);

            barLabel.append(new TextBox(content, barLabel.options));
        },

        options: {
            position: OUTSIDE_END,
            margin: getSpacing(3),
            padding: getSpacing(4),
            color: BLACK,
            background: "",
            border: {
                width: 1,
                color: ""
            },
            aboveAxis: true,
            isVertical: false,
            animation: {
                type: FADEIN,
                delay: INITIAL_ANIMATION_DURATION
            },
            zIndex: 1
        },

        reflow: function(targetBox) {
            var barLabel = this,
                options = barLabel.options,
                isVertical = options.isVertical,
                aboveAxis = options.aboveAxis,
                text = barLabel.children[0],
                box = text.box,
                padding = text.options.padding;

            text.options.align = isVertical ? CENTER : LEFT;
            text.options.vAlign = isVertical ? TOP : CENTER;

            if (options.position == INSIDE_END) {
                if (isVertical) {
                    text.options.vAlign = TOP;

                    if (!aboveAxis && box.height() < targetBox.height()) {
                        text.options.vAlign = BOTTOM;
                    }
                } else {
                    text.options.align = aboveAxis ? RIGHT : LEFT;
                }
            } else if (options.position == CENTER) {
                text.options.vAlign = CENTER;
                text.options.align = CENTER;
            } else if (options.position == INSIDE_BASE) {
                if (isVertical) {
                    text.options.vAlign = aboveAxis ? BOTTOM : TOP;
                } else {
                    text.options.align = aboveAxis ? LEFT : RIGHT;
                }
            } else if (options.position == OUTSIDE_END) {
                if (isVertical) {
                    if (aboveAxis) {
                        targetBox = new Box2D(
                            targetBox.x1, targetBox.y1 - box.height(),
                            targetBox.x2, targetBox.y1
                        );
                    } else {
                        targetBox = new Box2D(
                            targetBox.x1, targetBox.y2,
                            targetBox.x2, targetBox.y2 + box.height()
                        );
                    }
                } else {
                    text.options.align = CENTER;
                    if (aboveAxis) {
                        targetBox = new Box2D(
                            targetBox.x2 + box.width(), targetBox.y1,
                            targetBox.x2, targetBox.y2
                        );
                    } else {
                        targetBox = new Box2D(
                            targetBox.x1 - box.width(), targetBox.y1,
                            targetBox.x1, targetBox.y2
                        );
                    }
                }
            }

            if (isVertical) {
                padding.left = padding.right =
                    (targetBox.width() - text.contentBox.width()) / 2;
            } else {
                padding.top = padding.bottom =
                    (targetBox.height() - text.contentBox.height()) / 2;
            }

            text.reflow(targetBox);
        }
    });

    var Title = ChartElement.extend({
        init: function(options) {
            var title = this;
            ChartElement.fn.init.call(title, options);

            title.append(
                new TextBox(title.options.text, deepExtend({}, title.options, {
                    vAlign: title.options.position
                }))
            );
        },

        options: {
            text: "",
            color: BLACK,
            position: TOP,
            align: CENTER,
            margin: getSpacing(5),
            padding: getSpacing(5)
        },

        reflow: function(targetBox) {
            var title = this;

            ChartElement.fn.reflow.call(title, targetBox);
            title.box.snapTo(targetBox, X);
        }
    });

    var Legend = ChartElement.extend({
        init: function(options) {
            var legend = this;

            ChartElement.fn.init.call(legend, options);

            legend.createLabels();
        },

        options: {
            position: RIGHT,
            items: [],
            labels: {},
            offsetX: 0,
            offsetY: 0,
            margin: getSpacing(10),
            padding: getSpacing(5),
            border: {
                color: BLACK,
                width: 0
            },
            background: "",
            zIndex: 1
        },

        createLabels: function() {
            var legend = this,
                items = legend.options.items,
                count = items.length,
                label,
                name,
                i;

            for (i = 0; i < count; i++) {
                name = items[i].name;
                    label = new Text(name, legend.options.labels);

                legend.append(label);
            }
        },

        reflow: function(targetBox) {
            var legend = this,
                options = legend.options,
                childrenCount = legend.children.length;

            if (childrenCount === 0) {
                legend.box = targetBox.clone();
                return;
            }

            if (options.position == "custom") {
                legend.customLayout(targetBox);
                return;
            }

            if (options.position == TOP || options.position == BOTTOM) {
                legend.horizontalLayout(targetBox);
            } else {
                legend.verticalLayout(targetBox);
            }
        },

        getViewElements: function(view) {
            var legend = this,
                children = legend.children,
                options = legend.options,
                items = options.items,
                count = items.length,
                markerSize = legend.markerSize(),
                group = view.createGroup({ zIndex: options.zIndex }),
                border = options.border || {},
                padding,
                markerBox,
                labelBox,
                color,
                label,
                box,
                i;

            append(group.children, ChartElement.fn.getViewElements.call(legend, view));

            for (i = 0; i < count; i++) {
                color = items[i].color;
                label = children[i];
                markerBox = new Box2D();
                box = label.box;

                labelBox = labelBox ? labelBox.wrap(box) : box.clone();

                markerBox.x1 = box.x1 - markerSize * 2;
                markerBox.x2 = markerBox.x1 + markerSize;

                if (options.position == TOP || options.position == BOTTOM) {
                    markerBox.y1 = box.y1 + markerSize / 2;
                } else {
                    markerBox.y1 = box.y1 + (box.height() - markerSize) / 2;
                }

                markerBox.y2 = markerBox.y1 + markerSize;

                group.children.push(view.createRect(markerBox, { fill: color, stroke: color }));
            }

            if (children.length > 0) {
                padding = getSpacing(options.padding);
                padding.left += markerSize * 2;
                labelBox.pad(padding);
                group.children.unshift(view.createRect(labelBox, {
                    stroke: border.width ? border.color : "",
                    strokeWidth: border.width,
                    dashType: border.dashType,
                    fill: options.background })
                );
            }

            return [ group ];
        },

        verticalLayout: function(targetBox) {
            var legend = this,
                options = legend.options,
                children = legend.children,
                childrenCount = children.length,
                labelBox = children[0].box.clone(),
                offsetX,
                offsetY,
                margin = getSpacing(options.margin),
                markerSpace = legend.markerSize() * 2,
                label,
                i;

            // Position labels below each other
            for (i = 1; i < childrenCount; i++) {
                label = legend.children[i];
                label.box.alignTo(legend.children[i - 1].box, BOTTOM);
                labelBox.wrap(label.box);
            }

            // Vertical center is calculated relative to the container, not the parent!
            if (options.position == LEFT) {
                offsetX = targetBox.x1 + markerSpace + margin.left;
                offsetY = (targetBox.y2 - labelBox.height()) / 2;
                labelBox.x2 += markerSpace + margin.left + margin.right;
            } else {
                offsetX = targetBox.x2 - labelBox.width() - margin.right;
                offsetY = (targetBox.y2 - labelBox.height()) / 2;
                labelBox.translate(offsetX, offsetY);
                labelBox.x1 -= markerSpace + margin.left;
            }

            legend.translateChildren(offsetX + options.offsetX,
                    offsetY + options.offsetY);

            var labelBoxWidth = labelBox.width();
            labelBox.x1 = math.max(targetBox.x1, labelBox.x1);
            labelBox.x2 = labelBox.x1 + labelBoxWidth;

            labelBox.y1 = targetBox.y1;
            labelBox.y2 = targetBox.y2;

            legend.box = labelBox;
        },

        horizontalLayout: function(targetBox) {
            var legend = this,
                options = legend.options,
                children = legend.children,
                childrenCount = children.length,
                box = children[0].box.clone(),
                markerWidth = legend.markerSize() * 3,
                offsetX,
                offsetY,
                margin = getSpacing(options.margin),
                boxWidth = children[0].box.width() + markerWidth,
                plotAreaWidth = targetBox.width(),
                label,
                labelY = 0,
                i;

            // Position labels next to each other
            for (i = 1; i < childrenCount; i++) {
                label = children[i];

                boxWidth += label.box.width() + markerWidth;
                if (boxWidth > plotAreaWidth - markerWidth) {
                    label.box = new Box2D(box.x1, box.y2,
                        box.x1 + label.box.width(), box.y2 + label.box.height());
                    boxWidth = label.box.width() + markerWidth;
                    labelY = label.box.y1;
                } else {
                    label.box.alignTo(children[i - 1].box, RIGHT);
                    label.box.y2 = labelY + label.box.height();
                    label.box.y1 = labelY;
                    label.box.translate(markerWidth, 0);
                }
                box.wrap(label.box);
            }

            offsetX = (targetBox.width() - box.width() + markerWidth) / 2;
            if (options.position === TOP) {
                offsetY = targetBox.y1 + margin.top;
                box.y2 = targetBox.y1 + box.height() + margin.top + margin.bottom;
                box.y1 = targetBox.y1;
            } else {
                offsetY = targetBox.y2 - box.height() - margin.bottom;
                box.y1 = targetBox.y2 - box.height() - margin.top - margin.bottom;
                box.y2 = targetBox.y2;
            }

            legend.translateChildren(offsetX + options.offsetX,
                    offsetY + options.offsetY);

            box.x1 = targetBox.x1;
            box.x2 = targetBox.x2;

            legend.box = box;
        },

        customLayout: function (targetBox) {
            var legend = this,
                options = legend.options,
                children = legend.children,
                childrenCount = children.length,
                labelBox = children[0].box.clone(),
                markerWidth = legend.markerSize() * 2,
                i;

            // Position labels next to each other
            for (i = 1; i < childrenCount; i++) {
                labelBox = legend.children[i].box;
                labelBox.alignTo(legend.children[i - 1].box, BOTTOM);
                labelBox.wrap(labelBox);
            }

            legend.translateChildren(options.offsetX + markerWidth, options.offsetY);

            legend.box = targetBox;
        },

        markerSize: function() {
            var legend = this,
                children = legend.children;

            if (children.length > 0) {
                return children[0].box.height() / 2;
            } else {
                return 0;
            }
        }
    });

    var Axis = ChartElement.extend({
        init: function(options) {
            var axis = this;

            ChartElement.fn.init.call(axis, options);

            if (!axis.options.visible) {
                axis.options = deepExtend({}, axis.options, {
                    labels: {
                        visible: false
                    },
                    line: {
                        visible: false
                    },
                    margin: 0,
                    majorTickSize: 0,
                    minorTickSize: 0
                });
            }

            axis.createLabels();
            axis.createTitle();
        },

        options: {
            labels: {
                visible: true,
                rotation: 0,
                mirror: false,
                step: 1
            },
            line: {
                width: 1,
                color: BLACK,
                visible: true
            },
            title: {
                visible: true,
                position: CENTER
            },
            majorTickType: OUTSIDE,
            majorTickSize: 4,
            minorTickType: NONE,
            minorTickSize: 3,
            axisCrossingValue: 0,
            minorGridLines: {
                visible: false,
                width: 1,
                color: BLACK
            },
            // TODO: Move to line or labels options
            margin: 5,
            visible: true
        },

        createLabels: function() {
            var axis = this,
                options = axis.options,
                align = options.isVertical ? RIGHT : CENTER,
                labelOptions = deepExtend({ }, options.labels, {
                    align: align, zIndex: options.zIndex
                }),
                step = labelOptions.step;

            axis.labels = [];
            if (labelOptions.visible) {
                var labelsCount = axis.getLabelsCount(),
                    labelText,
                    label,
                    i;

                for (i = 0; i < labelsCount; i += step) {
                    labelText = axis.getLabelText(i);

                    if (labelOptions.template) {
                        labelTemplate = baseTemplate(labelOptions.template);
                        labelText = labelTemplate({ value: labelText });
                    }

                    label = new TextBox(labelText, labelOptions);
                    axis.append(label);
                    axis.labels.push(label);
                }
            }
        },

        getLabelsCount: function() {
        },

        getLabelText: function(index) {
        },

        lineBox: function() {
            var axis = this,
                options = axis.options,
                box = axis.box,
                isVertical = options.isVertical,
                mirror = options.labels.mirror,
                axisX = mirror ? box.x1 : box.x2,
                axisY = mirror ? box.y2 : box.y1;

            if (isVertical) {
                return new Box2D(axisX, box.y1, axisX, box.y2);
            }

            return new Box2D(box.x1, axisY, box.x2, axisY);
        },

        createTitle: function() {
            var axis = this,
                options = axis.options,
                titleOptions = deepExtend({
                    rotation: options.isVertical ? -90 : 0,
                    text: "",
                    zIndex: 1
                }, options.title),
                title;

            if (titleOptions.visible && titleOptions.text) {
                title = new TextBox(titleOptions.text, titleOptions);
                axis.append(title);
                axis.title = title;
            }
        },

        renderTicks: function(view) {
            var axis = this,
                options = axis.options,
                mirror = options.labels.mirror,
                lineBox = axis.lineBox(),
                majorTicks = axis.getMajorTickPositions(),
                ticks = [];

            if (options.majorTickType.toLowerCase() === OUTSIDE) {
                ticks = ticks.concat(map(majorTicks, function(pos) {
                    return {
                        pos: pos,
                        size: options.majorTickSize,
                        width: options.line.width,
                        color: options.line.color
                    };
                }));
            }

            if (options.minorTickType.toLowerCase() === OUTSIDE) {
                ticks = ticks.concat(map(axis.getMinorTickPositions(), function(pos) {
                    if (options.majorTickType.toLowerCase() !== NONE) {
                        if (!inArray(pos, majorTicks)) {
                            return {
                                pos: pos,
                                size: options.minorTickSize,
                                width: options.line.width,
                                color: options.line.color
                            };
                        }
                    } else {
                        return {
                            pos: pos,
                            size: options.minorTickSize,
                            width: options.line.width,
                            color: options.line.color
                        };
                    }
                }));
            }

            return map(ticks, function(tick) {
                var tickX = mirror ? lineBox.x2 : lineBox.x2 - tick.size,
                    tickY = mirror ? lineBox.y1 - tick.size : lineBox.y1;

                if (options.isVertical) {
                    return view.createLine(
                        tickX, tick.pos, tickX + tick.size, tick.pos,
                        {
                            strokeWidth: tick.width,
                            stroke: tick.color
                        }
                    );
                } else {
                    return view.createLine(
                        tick.pos, tickY, tick.pos, tickY + tick.size,
                        {
                            strokeWidth: tick.width,
                            stroke: tick.color
                        }
                    );
                }
            });
        },

        getActualTickSize: function () {
            var axis = this,
                options = axis.options,
                tickSize = 0;

            if (options.majorTickType != NONE && options.minorTickType != NONE ) {
                tickSize = math.max(options.majorTickSize, options.minorTickSize);
            } else if (options.majorTickType != NONE) {
                tickSize = options.majorTickSize;
            } else if (options.minorTickType != NONE) {
                tickSize = options.minorTickSize;
            }

            return tickSize;
        },

        renderPlotBands: function(view) {
            var axis = this,
                options = axis.options,
                plotBands = options.plotBands || [],
                isVertical = options.isVertical,
                result = [],
                plotArea = axis.parent,
                slotX,
                slotY,
                from,
                to;

            if (plotBands.length) {
                result = map(plotBands, function(item) {
                    from = defined(item.from) ? item.from : MIN_VALUE;
                    to = defined(item.to) ? item.to : MAX_VALUE;
                    item.from = math.min(from, to);
                    item.to = math.max(from, to);
                    slotX = isVertical ? plotArea.axisX.lineBox()  : plotArea.axisX.getSlot(item.from, item.to);
                    slotY = isVertical ? plotArea.axisY.getSlot(item.from, item.to) : plotArea.axisY.lineBox();
                    return view.createRect(
                            new Box2D(slotX.x1, slotY.y1, slotX.x2, slotY.y2),
                            { fill: item.color, fillOpacity: item.opacity, zIndex: -1 });
                });
            }

            return result;
        },

        reflowAxis: function(box, position) {
            var axis = this,
                options = axis.options,
                isVertical = options.isVertical,
                labels = axis.labels,
                count = labels.length,
                space = axis.getActualTickSize() + options.margin,
                maxLabelHeight = 0,
                maxLabelWidth = 0,
                title = axis.title,
                label,
                i;

            for (i = 0; i < count; i++) {
                label = labels[i];
                maxLabelHeight = math.max(maxLabelHeight, label.box.height());
                maxLabelWidth = math.max(maxLabelWidth, label.box.width());
            }

            if (title) {
                if (isVertical) {
                    maxLabelWidth += title.box.width()
                } else {
                    maxLabelHeight += title.box.height();
                }
            }

            if (isVertical) {
                axis.box = new Box2D(
                    box.x1, box.y1,
                    box.x1 + maxLabelWidth + space, box.y2
                );
            } else {
                axis.box = new Box2D(
                    box.x1, box.y1,
                    box.x2, box.y1 + maxLabelHeight + space
                );
            }

            axis.arrangeTitle();
            axis.arrangeLabels(maxLabelWidth, maxLabelHeight, position);
        },

        arrangeLabels: function(maxLabelWidth, maxLabelHeight, position) {
            var axis = this,
                options = axis.options,
                labelStep = options.labels.step,
                labels = axis.labels,
                isVertical = options.isVertical,
                lineBox = axis.lineBox(),
                mirror = options.labels.mirror,
                tickPositions = axis.getMajorTickPositions(),
                tickSize = axis.getActualTickSize(),
                labelOffset = axis.getActualTickSize() + options.margin,
                labelBox,
                labelY,
                i;

            for (i = 0; i < labels.length; i++) {
                var label = labels[i],
                    tickIx = labelStep * i,
                    labelSize = isVertical ? label.box.height() : label.box.width(),
                    labelPos = tickPositions[tickIx] - (labelSize / 2),
                    firstTickPosition,
                    nextTickPosition,
                    middle,
                    labelX;

                if (isVertical) {
                    if (position == ON_MINOR_TICKS) {
                        firstTickPosition = tickPositions[tickIx];
                        nextTickPosition = tickPositions[tickIx + 1];

                        middle = firstTickPosition + (nextTickPosition - firstTickPosition) / 2;
                        labelPos = middle - (labelSize / 2);
                    }

                    labelX = lineBox.x2;

                    if (mirror) {
                        labelX += labelOffset;
                    } else {
                        labelX -= labelOffset + label.box.width();
                    }

                    labelBox = label.box.move(labelX, labelPos);
                } else {
                    if (position == ON_MINOR_TICKS) {
                        firstTickPosition = tickPositions[tickIx];
                        nextTickPosition = tickPositions[tickIx + 1];
                    } else {
                        firstTickPosition = labelPos;
                        nextTickPosition = labelPos + labelSize;
                    }

                    labelY = lineBox.y1;

                    if (mirror) {
                        labelY -= labelOffset + label.box.height();
                    } else {
                        labelY += labelOffset;
                    }

                    labelBox = new Box2D(firstTickPosition, labelY,
                                         nextTickPosition, labelY + label.box.height());
                }

                label.reflow(labelBox);
            }
        },

        arrangeTitle: function() {
            var axis = this,
                options = axis.options,
                mirror = options.labels.mirror,
                isVertical = options.isVertical,
                title = axis.title;

            if (title) {
                if (isVertical) {
                    title.options.align = mirror ? RIGHT : LEFT;
                    title.options.vAlign = title.options.position;
                } else {
                    title.options.align = title.options.position;
                    title.options.vAlign = mirror ? TOP : BOTTOM;
                }

                title.reflow(axis.box);
            }
        }
    });

    var NumericAxis = Axis.extend({
        init: function(seriesMin, seriesMax, options) {
            var axis = this,
                defaultOptions = axis.initDefaults(seriesMin, seriesMax, options),
                labelTemplate,
                i;

            Axis.fn.init.call(axis, defaultOptions);
        },

        options: {
            min: 0,
            max: 1,
            isVertical: true,
            majorGridLines: {
                visible: true,
                width: 1,
                color: BLACK
            },
            zIndex: 1
        },

        initDefaults: function(seriesMin, seriesMax, options) {
            var axis = this,
                autoMin = axis.autoAxisMin(seriesMin, seriesMax),
                autoMax = axis.autoAxisMax(seriesMin, seriesMax),
                autoMajorUnit = axis.autoMajorUnit(autoMin, autoMax),
                autoOptions = {
                    majorUnit: autoMajorUnit
                },
                userSetLimits;

            if (autoMin < 0) {
                autoMin -= autoMajorUnit;
            }

            if (autoMax > 0) {
                autoMax += autoMajorUnit;
            }

            autoOptions.min = floor(autoMin, autoMajorUnit);
            autoOptions.max = ceil(autoMax, autoMajorUnit);

            if (options) {
                userSetLimits = defined(options.min) || defined(options.max);
                if (userSetLimits) {
                    if (options.min === options.max) {
                        if (options.min > 0) {
                            options.min = 0;
                        } else {
                            options.max = 1;
                        }
                    }
                }

                if (options.majorUnit) {
                    autoOptions.min = floor(autoOptions.min, options.majorUnit);
                    autoOptions.max = ceil(autoOptions.max, options.majorUnit);
                } else if (userSetLimits) {
                    options = deepExtend(autoOptions, options);

                    // Determine an auto major unit after min/max have been set
                    autoOptions.majorUnit = axis.autoMajorUnit(options.min, options.max);
                }
            }

            return deepExtend(autoOptions, options);
        },

        range: function() {
            var options = this.options;
            return { min: options.min, max: options.max };
        },

        reflow: function(targetBox) {
            this.reflowAxis(targetBox);
        },

        getViewElements: function(view) {
            var axis = this,
                options = axis.options,
                line = options.line,
                childElements = ChartElement.fn.getViewElements.call(axis, view),
                lineBox = axis.lineBox(),
                lineOptions;

            if (line.width > 0 && line.visible) {
                lineOptions = {
                    strokeWidth: line.width,
                    stroke: line.color,
                    dashType: line.dashType,
                    zIndex: options.zIndex
                };
                if (options.isVertical) {
                    childElements.push(view.createLine(
                        lineBox.x1, lineBox.y1,
                        lineBox.x1, lineBox.y2,
                        lineOptions));
                } else {
                    childElements.push(view.createLine(
                        lineBox.x1, lineBox.y1,
                        lineBox.x2, lineBox.y1,
                        lineOptions));
                }

                append(childElements, axis.renderTicks(view));
                append(childElements, axis.renderPlotBands(view));
            }

            return childElements;
        },

        autoMajorUnit: function (min, max) {
            var diff = max - min;

            if (diff == 0) {
                if (max == 0) {
                    return 0.1;
                }

                diff = math.abs(max);
            }

            var scale = math.pow(10, math.floor(math.log(diff) / math.log(10))),
                relativeValue = round((diff / scale), DEFAULT_PRECISION),
                scaleMultiplier = 1;

            if (relativeValue < 1.904762) {
                scaleMultiplier = 0.2;
            } else if (relativeValue < 4.761904) {
                scaleMultiplier = 0.5;
            } else if (relativeValue < 9.523809) {
                scaleMultiplier = 1;
            } else {
                scaleMultiplier = 2;
            }

            return round(scale * scaleMultiplier, DEFAULT_PRECISION);
        },

        autoAxisMax: function(min, max) {
            if (min == 0 && max == 0) {
                return 1;
            }

            var axisMax;
            if (min <= 0 && max <= 0) {
                max = min == max ? 0 : max;

                var diff = math.abs((max - min) / max);
                if(diff > ZERO_THRESHOLD) {
                    return 0;
                }

                axisMax = max - ((min - max) / 2);
            } else {
                min = min == max ? 0 : min;
                axisMax = max;
            }

            return axisMax;
        },

        autoAxisMin: function(min, max) {
            if (min == 0 && max == 0) {
                return 0;
            }

            var axisMin;
            if (min >= 0 && max >= 0) {
                min = min == max ? 0 : min;

                var diff = (max - min) / max;
                if(diff > ZERO_THRESHOLD) {
                    return 0;
                }

                axisMin = min - ((max - min) / 2);
            } else {
                max = min == max ? 0 : max;
                axisMin = min;
            }

            return axisMin;
        },

        getDivisions: function(stepValue) {
            var options = this.options,
                range = options.max - options.min;

            return math.floor(round(range / stepValue, COORD_PRECISION)) + 1;
        },

        getTickPositions: function(stepValue) {
            var axis = this,
                options = axis.options,
                isVertical = options.isVertical,
                lineBox = axis.lineBox(),
                lineSize = isVertical ? lineBox.height() : lineBox.width(),
                range = options.max - options.min,
                scale = lineSize / range,
                step = stepValue * scale,
                divisions = axis.getDivisions(stepValue),
                pos = lineBox[isVertical ? "y2" : "x1"],
                multiplier = isVertical ? -1 : 1,
                positions = [],
                i;

            for (i = 0; i < divisions; i++) {
                positions.push(round(pos, COORD_PRECISION));
                pos = pos + step * multiplier;
            }

            return positions;
        },

        getMajorTickPositions: function() {
            var axis = this;

            return axis.getTickPositions(axis.options.majorUnit);
        },

        getMinorTickPositions: function() {
            var axis = this;

            return axis.getTickPositions(axis.options.majorUnit / 5);
        },

        lineBox: function() {
            var axis = this,
                options = axis.options,
                isVertical = options.isVertical,
                labelSize = isVertical ? "height" : "width",
                labels = axis.labels,
                baseBox = Axis.fn.lineBox.call(axis),
                startMargin = 0,
                endMargin = 0;

            if (labels.length > 1) {
                startMargin = labels[0].box[labelSize]() / 2;
                endMargin = last(labels).box[labelSize]() / 2;
            }

            if (isVertical) {
               return new Box2D(baseBox.x1, baseBox.y1 + startMargin,
                 baseBox.x1, baseBox.y2 - endMargin);
            } else {
               return new Box2D(baseBox.x1 + startMargin, baseBox.y1,
                 baseBox.x2 - endMargin, baseBox.y1);
            }
        },

        getSlot: function(a, b) {
            var axis = this,
                options = axis.options,
                isVertical = options.isVertical,
                valueAxis = isVertical ? Y : X,
                lineBox = axis.lineBox(),
                lineStart = lineBox[valueAxis + 1],
                lineSize = isVertical ? lineBox.height() : lineBox.width(),
                scale = lineSize / (options.max - options.min),
                a = defined(a) ? a : options.axisCrossingValue,
                b = defined(b) ? b : options.axisCrossingValue,
                a = math.max(math.min(a, options.max), options.min),
                b = math.max(math.min(b, options.max), options.min),
                p1,
                p2,
                slotBox = new Box2D(lineBox.x1, lineBox.y1, lineBox.x1, lineBox.y1);

            if (isVertical) {
                p1 = lineStart + scale * (options.max - math.max(a, b));
                p2 = lineStart + scale * (options.max - math.min(a, b));
            } else {
                p1 = lineStart + scale * (math.min(a, b) - options.min);
                p2 = lineStart + scale * (math.max(a, b) - options.min);
            }

            slotBox[valueAxis + 1] = p1;
            slotBox[valueAxis + 2] = p2;

            return slotBox;
        },

        getLabelsCount: function() {
            return this.getDivisions(this.options.majorUnit);
        },

        getLabelText: function(index) {
            var options = this.options;
            return round(options.min + (index * options.majorUnit), DEFAULT_PRECISION);
        }
    });

    var CategoryAxis = Axis.extend({
        options: {
            categories: [],
            isVertical: false,
            majorGridLines: {
                visible: false,
                width: 1,
                color: BLACK
            },
            zIndex: 1
        },

        range: function() {
            return { min: 0, max: this.options.categories.length };
        },

        reflow: function(targetBox) {
            this.reflowAxis(targetBox, ON_MINOR_TICKS);
        },

        getViewElements: function(view) {
            var axis = this,
                options = axis.options,
                line = options.line,
                lineBox = axis.lineBox(),
                childElements = ChartElement.fn.getViewElements.call(axis, view),
                lineOptions;

            if (line.width > 0 && line.visible) {
                lineOptions = {
                    strokeWidth: line.width,
                    stroke: line.color,
                    dashType: line.dashType,
                    zIndex: line.zIndex
                };

                childElements.push(view.createLine(
                    lineBox.x1, lineBox.y1, lineBox.x2, lineBox.y2,
                    lineOptions));

                append(childElements, axis.renderTicks(view));
                append(childElements, axis.renderPlotBands(view));
            }

            return childElements;
        },

        getTickPositions: function(itemsCount) {
            var axis = this,
                options = axis.options,
                isVertical = options.isVertical,
                size = isVertical ? axis.box.height() : axis.box.width(),
                step = size / itemsCount,
                pos = isVertical ? axis.box.y1 : axis.box.x1,
                positions = [],
                i;

            for (i = 0; i < itemsCount; i++) {
                positions.push(round(pos, COORD_PRECISION));
                pos += step;
            }

            positions.push(isVertical ? axis.box.y2 : axis.box.x2);

            return positions;
        },

        getMajorTickPositions: function() {
            var axis = this;

            return axis.getTickPositions(axis.options.categories.length);
        },

        getMinorTickPositions: function() {
            var axis = this;

            return axis.getTickPositions(axis.options.categories.length * 2);
        },

        getSlot: function(from, to) {
            var axis = this,
                options = axis.options,
                isVertical = options.isVertical,
                childrenCount = math.max(1, options.categories.length),
                from = math.min(math.max(0, from), childrenCount),
                to = defined(to) ? to : from,
                to = math.max(math.min(childrenCount, to), from),
                lineBox = axis.lineBox(),
                size = isVertical ? lineBox.height() : lineBox.width(),
                startPos = isVertical ? lineBox.y1 : lineBox.x1,
                step = size / childrenCount,
                p1 = startPos + (from * step),
                p2 = p1 + step,
                length = to - from;

            if (length > 0 || (from == to && childrenCount == from)) {
                p2 = p1 + (length * step);
            }

            return isVertical ?
                   new Box2D(lineBox.x2, p1, lineBox.x2, p2) :
                   new Box2D(p1, lineBox.y1, p2, lineBox.y1);
        },

        getLabelsCount: function() {
            return this.options.categories.length;
        },

        getLabelText: function(index) {
            var options = this.options;
            return defined(options.categories[index]) ? options.categories[index] : "";
        }
    });

    var ClusterLayout = ChartElement.extend({
        init: function(options) {
            var cluster = this;
            ChartElement.fn.init.call(cluster, options);
        },

        options: {
            isVertical: false,
            gap: 0,
            spacing: 0
        },

        reflow: function(box) {
            var cluster = this,
                options = cluster.options,
                isVertical = options.isVertical,
                axis = isVertical ? Y : X,
                children = cluster.children,
                gap = options.gap,
                spacing = options.spacing,
                count = children.length,
                slots = count + gap + (spacing * (count - 1)),
                slotSize = (isVertical ? box.height() : box.width()) / slots,
                position = box[axis + 1] + slotSize * (gap / 2),
                childBox,
                i;

            for (i = 0; i < count; i++) {
                childBox = (children[i].box || box).clone();

                childBox[axis + 1] = position;
                childBox[axis + 2] = position + slotSize;

                children[i].reflow(childBox);
                if (i < count - 1) {
                    position += (slotSize * spacing);
                }

                position += slotSize;
            }
        }
    });

    var StackLayout = ChartElement.extend({
        init: function(options) {
            var stack = this;
            ChartElement.fn.init.call(stack, options);
        },

        options: {
            isVertical: true,
            isReversed: false
        },

        reflow: function(targetBox) {
            var stack = this,
                options = stack.options,
                isVertical = options.isVertical,
                positionAxis = isVertical ? X : Y,
                stackAxis = isVertical ? Y : X,
                stackBase = targetBox[stackAxis + 2],
                children = stack.children,
                box = stack.box = new Box2D(),
                childrenCount = children.length,
                stackDirection,
                i;

            if (options.isReversed) {
                stackDirection = isVertical ? BOTTOM : LEFT;
            } else {
                stackDirection = isVertical ? TOP : RIGHT;
            }

            for (i = 0; i < childrenCount; i++) {
                var currentChild = children[i],
                    childBox = currentChild.box.clone();

                childBox.snapTo(targetBox, positionAxis)
                if (currentChild.options) {
                    currentChild.options.stackBase = stackBase;
                }

                if (i == 0) {
                    box = stack.box = childBox.clone();
                } else {
                    childBox.alignTo(children[i - 1].box, stackDirection);
                }

                currentChild.reflow(childBox);

                box.wrap(childBox);
            }
        }
    });

    var Bar = ChartElement.extend({
        init: function(value, options) {
            var bar = this;

            bar.value = value;
            bar.options.id = uniqueId();

            ChartElement.fn.init.call(bar, options);
        },

        options: {
            color: WHITE,
            border: {
                width: 1
            },
            isVertical: true,
            overlay: {
                gradient: GLASS
            },
            aboveAxis: true,
            labels: {
                visible: false
            },
            animation: {
                type: BAR
            },
            opacity: 1
        },

        render: function() {
            var bar = this,
                value = bar.value,
                options = bar.options,
                labels = options.labels,
                labelText = value,
                labelTemplate;

            if (bar._rendered) {
                return;
            } else {
                bar._rendered = true;
            }

            if (labels.visible && value) {
                if (labels.template) {
                    labelTemplate = baseTemplate(labels.template);
                    labelText = labelTemplate({
                        dataItem: bar.dataItem,
                        category: bar.category,
                        value: bar.value,
                        series: bar.series
                    });
                }

                bar.append(
                    new BarLabel(labelText, deepExtend({
                            isVertical: options.isVertical,
                            id: uniqueId()},
                        options.labels)
                    )
                );
            }
        },

        reflow: function(targetBox) {
            this.render();

            var bar = this,
                options = bar.options,
                children = bar.children,
                label = children[0];

            bar.box = targetBox;

            if (label) {
                label.options.aboveAxis = options.aboveAxis;
                label.reflow(targetBox);
            }
        },

        getViewElements: function(view) {
            var bar = this,
                options = bar.options,
                isVertical = options.isVertical,
                normalAngle = isVertical ? 0 : 90,
                border = options.border.width > 0 ? {
                    stroke: bar.getBorderColor(),
                    strokeWidth: options.border.width,
                    dashType: options.border.dashType
                } : {},
                box = bar.box,
                rectStyle = deepExtend({
                    id: options.id,
                    fill: options.color,
                    normalAngle: normalAngle,
                    aboveAxis: options.aboveAxis,
                    fillOpacity: options.opacity,
                    strokeOpacity: options.opacity,
                    stackBase: options.stackBase,
                    animation: options.animation
                }, border),
                elements = [],
                label = bar.children[0];

            if (options.overlay) {
                rectStyle.overlay = deepExtend({rotation: normalAngle }, options.overlay);
            }

            elements.push(view.createRect(box, rectStyle));

            append(elements,
                ChartElement.fn.getViewElements.call(bar, view));

            bar.registerId(options.id);
            if (label) {
                bar.registerId(label.options.id);
            }

            return elements;
        },

        getOutlineElement: function(view, options){
            var bar = this,
                box = bar.box,
                outlineId = bar.options.id + OUTLINE_SUFFIX;

            bar.registerId(outlineId);
            options = deepExtend({}, options, { id: outlineId });

            return view.createRect(box, options);
        },

        getBorderColor: function() {
            var bar = this,
                options = bar.options,
                color = options.color,
                borderColor = options.border.color;

            if (!defined(borderColor)) {
                borderColor =
                    new Color(color).brightness(BAR_BORDER_BRIGHTNESS).toHex();
            }

            return borderColor;
        },

        tooltipAnchor: function(tooltipWidth, tooltipHeight) {
            var bar = this,
                options = bar.options,
                box = bar.box,
                isVertical = options.isVertical,
                aboveAxis = options.aboveAxis,
                x,
                y;

            if (isVertical) {
                x = box.x2 + TOOLTIP_OFFSET;
                y = aboveAxis ? box.y1 : box.y2 - tooltipHeight;
            } else {
                if (options.isStacked) {
                    x = box.x2 - tooltipWidth;
                    y = box.y1 - tooltipHeight - TOOLTIP_OFFSET;
                } else {
                    x = box.x2 + TOOLTIP_OFFSET;
                    y = box.y1;
                }
            }

            return new Point2D(x, y);
        },

        formatPointValue: function(format) {
            var point = this;

            return point.owner.formatPointValue(point.value, format);
        }
    });

    var CategoricalChart = ChartElement.extend({
        init: function(plotArea, options) {
            var chart = this;

            ChartElement.fn.init.call(chart, options);

            chart.plotArea = plotArea;

            // Value axis ranges grouped by axis name, e.g.:
            // primary: { min: 0, max: 1 }
            chart.valueAxisRanges = {};

            chart.points = [];
            chart.categoryPoints = [];
            chart.seriesPoints = [];

            chart.render();
        },

        options: {
            series: [],
            invertAxes: false,
            isStacked: false
        },

        render: function() {
            var chart = this;

            chart.traverseDataPoints(proxy(chart.addValue, chart));
        },

        addValue: function(value, category, categoryIx, series, seriesIx) {
            var chart = this,
                point,
                categoryPoints = chart.categoryPoints[categoryIx],
                seriesPoints = chart.seriesPoints[seriesIx];

            if (!categoryPoints) {
                chart.categoryPoints[categoryIx] = categoryPoints = [];
            }

            if (!seriesPoints) {
                chart.seriesPoints[seriesIx] = seriesPoints = [];
            }

            chart.updateRange(value, categoryIx, series);

            point = chart.createPoint(value, category, categoryIx, series, seriesIx);
            if (point) {
                point.category = category;
                point.series = series;
                point.seriesIx = seriesIx;
                point.owner = chart;
                point.dataItem = series.dataItems ?
                    series.dataItems[categoryIx] : { value: value };
            }

            chart.points.push(point);
            seriesPoints.push(point);
            categoryPoints.push(point);
        },

        updateRange: function(value, categoryIx, series) {
            var chart = this,
                axisName = series.axis || PRIMARY,
                axisRange = chart.valueAxisRanges[axisName];

            if (defined(value)) {
                axisRange = chart.valueAxisRanges[axisName] =
                    axisRange || { min: MAX_VALUE, max: MIN_VALUE };

                axisRange.min = math.min(axisRange.min, value);
                axisRange.max = math.max(axisRange.max, value);
            }
        },

        seriesValueAxis: function(series) {
            return this.plotArea.namedValueAxes[(series || {}).axis || PRIMARY];
        },

        reflow: function(targetBox) {
            var chart = this,
                options = chart.options,
                invertAxes = options.invertAxes,
                plotArea = chart.plotArea,
                pointIx = 0,
                categorySlots = chart.categorySlots = [],
                chartPoints = chart.points,
                categoryAxis = plotArea.categoryAxis,
                valueAxis,
                point;

            chart.traverseDataPoints(function(value, category, categoryIx, currentSeries) {
                valueAxis = chart.seriesValueAxis(currentSeries);
                point = chartPoints[pointIx++];
                if (point && point.plotValue) {
                    value = point.plotValue;
                }

                var categorySlot = categoryAxis.getSlot(categoryIx),
                    valueSlot = valueAxis.getSlot(value),
                    slotX = invertAxes ? valueSlot : categorySlot,
                    slotY = invertAxes ? categorySlot : valueSlot,
                    pointSlot = new Box2D(slotX.x1, slotY.y1, slotX.x2, slotY.y2),
                    aboveAxis = value >= valueAxis.options.axisCrossingValue;

                if (point) {
                    point.options.aboveAxis = aboveAxis;
                    point.reflow(pointSlot);
                }

                if (!categorySlots[categoryIx]) {
                    categorySlots[categoryIx] = categorySlot;
                }
            });

            chart.reflowCategories(categorySlots);

            chart.box = targetBox;
        },

        reflowCategories: function() { },

        traverseDataPoints: function(callback) {
            var chart = this,
            options = chart.options,
            series = options.series,
            categories = chart.plotArea.options.categoryAxis.categories || [],
            count = categoriesCount(series),
            categoryIx,
            seriesIx,
            value,
            currentCategory,
            currentSeries;

            for (categoryIx = 0; categoryIx < count; categoryIx++) {
                for (seriesIx = 0; seriesIx < series.length; seriesIx++) {
                    currentCategory = categories[categoryIx];
                    currentSeries = series[seriesIx];
                    value = currentSeries.data[categoryIx];
                    callback(value, currentCategory, categoryIx, currentSeries, seriesIx);
                }
            }
        },

        formatPointValue: function(value, tooltipFormat) {
            return format(tooltipFormat, value);
        }
    });

    var BarChart = CategoricalChart.extend({
        init: function(plotArea, options) {
            var chart = this;

            chart._categoryTotalsPos = [];
            chart._categoryTotalsNeg = [];

            CategoricalChart.fn.init.call(chart, plotArea, options);
        },

        render: function() {
            var chart = this;

            CategoricalChart.fn.render.apply(chart);
            chart.computeAxisRanges();
        },

        createPoint: function(value, category, categoryIx, series, seriesIx) {
            var barChart = this,
                options = barChart.options,
                children = barChart.children,
                isStacked = barChart.options.isStacked,
                labelOptions = deepExtend({}, series.labels);

            if (isStacked) {
                if (labelOptions.position == OUTSIDE_END) {
                    labelOptions.position = INSIDE_END;
                }
            }

            var bar = new Bar(value,
                deepExtend({}, {
                    isVertical: !options.invertAxes,
                    overlay: series.overlay,
                    labels: labelOptions,
                    isStacked: isStacked
                }, series));

            var cluster = children[categoryIx];
            if (!cluster) {
                cluster = new ClusterLayout({
                    isVertical: options.invertAxes,
                    gap: options.gap,
                    spacing: options.spacing
                });
                barChart.append(cluster);
            }

            if (isStacked) {
                var stackWrap = cluster.children[0],
                    positiveStack,
                    negativeStack;

                if (!stackWrap) {
                    stackWrap = new ChartElement();
                    cluster.append(stackWrap);

                    positiveStack = new StackLayout({
                        isVertical: !options.invertAxes
                    });
                    negativeStack = new StackLayout({
                        isVertical: !options.invertAxes,
                        isReversed: true
                    });
                    stackWrap.append(positiveStack, negativeStack);
                } else {
                    positiveStack = stackWrap.children[0];
                    negativeStack = stackWrap.children[1];
                }

                if (value > 0) {
                    positiveStack.append(bar);
                } else {
                    negativeStack.append(bar);
                }
            } else {
                cluster.append(bar);
            }

            return bar;
        },

        updateRange: function(value, categoryIx, series) {
            var chart = this,
                isStacked = chart.options.isStacked,
                totalsPos = chart._categoryTotalsPos,
                totalsNeg = chart._categoryTotalsNeg;

            if (defined(value)) {
                if (isStacked) {
                    incrementSlot(value > 0 ? totalsPos : totalsNeg, categoryIx, value);
                } else {
                    CategoricalChart.fn.updateRange.apply(chart, arguments);
                }
            }
        },

        computeAxisRanges: function() {
            var chart = this,
                isStacked = chart.options.isStacked,
                axisName;

            if (isStacked) {
                axisName = chart.options.series[0].axis || PRIMARY;
                chart.valueAxisRanges[axisName] = {
                    min: sparseArrayMin(chart._categoryTotalsNeg.concat(0)),
                    max: sparseArrayMax(chart._categoryTotalsPos.concat(0))
                };
            }
        },

        seriesValueAxis: function(series) {
            var chart = this,
                options = chart.options;

            return CategoricalChart.fn.seriesValueAxis.call(
                chart,
                options.isStacked ? chart.options.series[0] : series
            );
        },

        reflowCategories: function(categorySlots) {
            var chart = this,
                children = chart.children,
                childrenLength = children.length,
                i;

            for (i = 0; i < childrenLength; i++) {
                children[i].reflow(categorySlots[i]);
            }
        }
    });

    var ShapeElement = BoxElement.extend({
        init: function(options) {
            var marker = this;

            BoxElement.fn.init.call(marker, options);
        },

        options: {
            type: SQUARE,
            align: CENTER,
            vAlign: CENTER
        },

        getViewElements: function(view, renderOptions) {
            var marker = this,
                options = marker.options,
                type = options.type,
                box = marker.paddingBox,
                element = BoxElement.fn.getViewElements.call(marker, view, renderOptions)[0],
                halfWidth = box.width() / 2;

            if (!element) {
                return [];
            }

            if (type === TRIANGLE) {
                element = view.createPolyline([
                    new Point2D(box.x1 + halfWidth, box.y1),
                    new Point2D(box.x1, box.y2),
                    new Point2D(box.x2, box.y2)
                ], true, element.options);
            } else if (type === CIRCLE) {
                element = view.createCircle([
                    round(box.x1 + halfWidth, COORD_PRECISION),
                    round(box.y1 + box.height() / 2, COORD_PRECISION)
                ], halfWidth, element.options);
            }

            return [ element ];
        }
    });

    var LinePoint = ChartElement.extend({
        init: function(value, options) {
            var point = this;

            point.value = value;

            ViewElement.fn.init.call(point, options);
        },

        options: {
            aboveAxis: true,
            isVertical: true,
            markers: {
                visible: true,
                background: WHITE,
                size: LINE_MARKER_SIZE,
                type: CIRCLE,
                border: {
                    width: 2
                },
                opacity: 1
            },
            labels: {
                visible: false,
                position: ABOVE,
                margin: getSpacing(3),
                padding: getSpacing(4),
                animation: {
                    type: FADEIN,
                    delay: INITIAL_ANIMATION_DURATION
                }
            }
        },

        render: function() {
            var point = this,
                options = point.options,
                markers = options.markers,
                labels = options.labels,
                markerBackground = markers.background,
                markerBorder = deepExtend({}, markers.border),
                labelText = point.value;

            if (point._rendered) {
                return;
            } else {
                point._rendered = true;
            }

            if (!defined(markerBorder.color)) {
                markerBorder.color =
                    new Color(markerBackground).brightness(BAR_BORDER_BRIGHTNESS).toHex();
            }

            point.marker = new ShapeElement({
                id: uniqueId(),
                visible: markers.visible,
                type: markers.type,
                width: markers.size,
                height: markers.size,
                background: markerBackground,
                border: markerBorder,
                opacity: markers.opacity
            });

            point.append(point.marker);

            if (labels.visible) {
                if (labels.template) {
                    var labelTemplate = baseTemplate(labels.template);
                    labelText = labelTemplate({
                        dataItem: point.dataItem,
                        category: point.category,
                        value: point.value,
                        series: point.series
                    });
                } else if (labels.format) {
                    labelText = point.formatPointValue(labels.format);
                }
                point.label = new TextBox(labelText,
                    deepExtend({
                        id: uniqueId(),
                        align: CENTER,
                        vAlign: CENTER,
                        margin: {
                            left: 5,
                            right: 5
                        }
                    }, labels, { format: "" })
                );
                point.append(point.label);
            }
        },

        markerBox: function() {
            return this.marker.box;
        },

        reflow: function(targetBox) {
            var point = this,
                options = point.options,
                isVertical = options.isVertical,
                aboveAxis = options.aboveAxis,
                childBox;

            point.render();

            point.box = targetBox;
            childBox = targetBox.clone();

            if (isVertical) {
                if (aboveAxis) {
                    childBox.y1 -= childBox.height();
                } else {
                    childBox.y2 += childBox.height();
                }
            } else {
                if (aboveAxis) {
                    childBox.x1 += childBox.width();
                } else {
                    childBox.x2 -= childBox.width();
                }
            }

            point.marker.reflow(childBox);
            point.reflowLabel(childBox);
        },

        reflowLabel: function(box) {
            var point = this,
                options = point.options,
                marker = point.marker,
                label = point.label,
                edge = options.labels.position;

            if (label) {
                edge = edge === ABOVE ? TOP : edge;
                edge = edge === BELOW ? BOTTOM : edge;

                label.reflow(box);
                label.box.alignTo(marker.box, edge);
                label.reflow(label.box);
            }
        },

        getViewElements: function(view) {
            var element = this,
                marker = element.marker,
                label = element.label;

            element.registerId(marker.options.id);

            if (label) {
                element.registerId(label.options.id);
            }

            return ChartElement.fn.getViewElements.call(element, view);
        },

        getOutlineElement: function(view, options) {
            var element = this,
                marker = element.marker,
                outlineId = element.marker.options.id + OUTLINE_SUFFIX;

            element.registerId(outlineId);
            options = deepExtend({}, options, { id: outlineId });

            return marker.getViewElements(view, deepExtend(options, {
                fill: marker.options.border.color,
                fillOpacity: 1,
                strokeOpacity: 0
            }))[0];
        },

        tooltipAnchor: function(tooltipWidth, tooltipHeight) {
            var point = this,
                markerBox = point.marker.box,
                aboveAxis = point.options.aboveAxis;

            return new Point2D(
                markerBox.x2 + TOOLTIP_OFFSET,
                aboveAxis ? markerBox.y1 - tooltipHeight : markerBox.y2
            );
        },

        formatPointValue: function(format) {
            var point = this;

            return point.owner.formatPointValue(point.value, format);
        }
    });

    var LineChartMixin = {
        splitSegments: function(view) {
            var chart = this,
                options = chart.options,
                series = options.series,
                seriesPoints = chart.seriesPoints,
                currentSeries,
                seriesIx,
                seriesCount = seriesPoints.length,
                currentSeriesPoints,
                linePoints,
                point,
                pointIx,
                pointCount,
                lines = [];

            for (seriesIx = 0; seriesIx < seriesCount; seriesIx++) {
                currentSeriesPoints = seriesPoints[seriesIx];
                pointCount = currentSeriesPoints.length;
                currentSeries = series[seriesIx];
                linePoints = [];

                for (pointIx = 0; pointIx < pointCount; pointIx++) {
                    point = currentSeriesPoints[pointIx];
                    if (point) {
                        pointCenter = point.markerBox().center();
                        linePoints.push(new Point2D(pointCenter.x, pointCenter.y));
                    } else if (currentSeries.missingValues !== INTERPOLATE) {
                        if (linePoints.length > 1) {
                            lines.push(
                                chart.createSegment(uniqueId(), view, linePoints, currentSeries, seriesIx));
                        }
                        linePoints = [];
                    }
                }

                if (linePoints.length > 1) {
                    lines.push(
                        chart.createSegment(uniqueId(), view, linePoints, currentSeries, seriesIx));
                }
            }

            return lines;
        },

        createSegment: function(lineId, view, points, series, seriesIx) {
            this.registerId(lineId, { seriesIx: seriesIx });
            return view.createPolyline(points, false, {
                id: lineId,
                stroke: series.color,
                strokeWidth: series.width,
                strokeOpacity: series.opacity,
                fill: "",
                dashType: series.dashType
            });
        },

        getNearestPoint: function(x, y, seriesIx) {
            var chart = this,
                invertAxes = chart.options.invertAxes,
                axis = invertAxes ? Y : X,
                pos = invertAxes ? y : x,
                points = chart.seriesPoints[seriesIx],
                nearestPointDistance = MAX_VALUE,
                pointsLength = points.length,
                currentPoint,
                pointBox,
                pointDistance,
                nearestPoint,
                i;

            for (i = 0; i < pointsLength; i++) {
                currentPoint = points[i];

                if (currentPoint && defined(currentPoint.value) && currentPoint.value !== null) {
                    pointBox = currentPoint.box;
                    pointDistance = math.abs(pointBox.center()[axis] - pos);

                    if (pointDistance < nearestPointDistance) {
                        nearestPoint = currentPoint;
                        nearestPointDistance = pointDistance;
                    }
                }
            }

            return nearestPoint;
        }
    };

    var LineChart = CategoricalChart.extend({
        init: function(plotArea, options) {
            var chart = this;

            chart._stackAxisRange = { min: MAX_VALUE, max: MIN_VALUE };
            chart._categoryTotals = [];

            CategoricalChart.fn.init.call(chart, plotArea, options);
        },

        render: function() {
            var chart = this;

            CategoricalChart.fn.render.apply(chart);
            chart.computeAxisRanges();
        },

        createPoint: function(value, category, categoryIx, series, seriesIx) {
            var chart = this,
                options = chart.options,
                isStacked = options.isStacked,
                categoryPoints = chart.categoryPoints[categoryIx],
                stackPoint,
                plotValue = 0;

            if (!defined(value) || value === null) {
                if (isStacked || series.missingValues === ZERO) {
                    value = 0;
                } else {
                    return null;
                }
            }

            var point = new LinePoint(value,
                deepExtend({
                    isVertical: !options.invertAxes,
                    markers: {
                        border: {
                            color: series.color
                        }
                    }
                }, series)
            );

            if (isStacked) {
                stackPoint = last(categoryPoints);
                if (stackPoint) {
                    plotValue = stackPoint.plotValue;
                }

                point.plotValue = value + plotValue;
            }

            chart.append(point);

            return point;
        },

        updateRange: function(value, categoryIx, series) {
            var chart = this,
                isStacked = chart.options.isStacked,
                stackAxisRange = chart._stackAxisRange,
                totals = chart._categoryTotals;

            if (defined(value)) {
                if (isStacked) {
                    incrementSlot(totals, categoryIx, value);

                    stackAxisRange.min = math.min(stackAxisRange.min, sparseArrayMin(totals));
                    stackAxisRange.max = math.max(stackAxisRange.max, sparseArrayMax(totals));
                } else {
                    CategoricalChart.fn.updateRange.apply(chart, arguments);
                }
            }
        },

        computeAxisRanges: function() {
            var chart = this,
                isStacked = chart.options.isStacked,
                axisName,
                totals = chart._categoryTotals;

            if (isStacked) {
                axisName = chart.options.series[0].axis || PRIMARY;
                chart.valueAxisRanges[axisName] = chart._stackAxisRange;
            }
        },

        getViewElements: function(view) {
            var chart = this,
                elements = CategoricalChart.fn.getViewElements.call(chart, view),
                group = view.createGroup({
                    animation: {
                        type: CLIP
                    }
                }),
                lines = chart.splitSegments(view);


            group.children = lines.concat(elements);
            return [group];
        }
    });
    deepExtend(LineChart.fn, LineChartMixin);

    var AreaChart = LineChart.extend({
        splitSegments: function(view) {
            var chart = this,
                options = chart.options,
                plotArea = chart.plotArea,
                invertAxes = chart.options.invertAxes,
                originalLines = LineChart.fn.splitSegments.call(chart, view),
                lines = [],
                axisLineBox = plotArea.categoryAxis.lineBox(),
                end = invertAxes ? axisLineBox.x1 : axisLineBox.y1,
                originalLinePoints,
                linesCount = originalLines.length,
                seriesIx = 0,
                linePoints,
                firstPoint,
                lastPoint,
                lineOptions,
                i;

            for (i = 0; i < linesCount; i++) {
                line = originalLines[i].clone();
                linePoints = line.points;
                lineOptions = line.options;
                seriesIx = lineOptions.seriesIx;

                if (lineOptions.stack && seriesIx != 0) {
                    if (seriesIx > 0) {
                        originalLinePoints = originalLines[i - 1].clone().points.reverse();
                        line.points = linePoints.concat(originalLinePoints);
                    }
                } else {
                    if (linePoints.length > 1) {
                        firstPoint = linePoints[0];
                        lastPoint = last(linePoints);

                        if (invertAxes) {
                            linePoints.unshift(new Point2D(end, firstPoint.y));
                            linePoints.push(new Point2D(end, lastPoint.y));
                        } else {
                            linePoints.unshift(new Point2D(firstPoint.x, end));
                            linePoints.push(new Point2D(lastPoint.x, end));
                        }
                    }
                }
                lines.push(line);
            }

            return lines;
        },

        createSegment: function(lineId, view, points, series, seriesIx) {
            var line = deepExtend({}, {
                    color: series.color,
                    opacity: series.opacity
                }, series.line);
            this.registerId(lineId, { seriesIx: seriesIx });

            return view.createPolyline(points, true, {
                id: lineId,
                stroke: line.color,
                strokeWidth: line.width,
                strokeOpacity: line.opacity,
                dashType: line.dashType,
                fillOpacity: series.opacity,
                fill: series.color,
                seriesIx: seriesIx,
                stack: series.stack
            });
        }
    });

    var ScatterChart = ChartElement.extend({
        init: function(plotArea, options) {
            var chart = this;

            ChartElement.fn.init.call(chart, options);

            chart.plotArea = plotArea;

            // X and Y axis ranges grouped by name, e.g.:
            // primary: { min: 0, max: 1 }
            chart.xAxisRanges = {};
            chart.yAxisRanges = {};

            chart.points = [];
            chart.seriesPoints = [];

            chart.render();
        },

        options: {
            series: [],
            tooltip: {
                format: "{0}, {1}"
            },
            labels: {
                format: "{0}, {1}"
            }
        },

        render: function() {
            var chart = this;

            chart.traverseDataPoints(proxy(chart.addValue, chart));
        },

        addValue: function(value, fields) {
            var chart = this,
                point,
                seriesIx = fields.seriesIx,
                seriesPoints = chart.seriesPoints[seriesIx];

            chart.updateRange(value, fields.series);

            point = chart.createPoint(value, fields.series, seriesIx);
            if (point) {
                extend(point, fields);
            }

            chart.points.push(point);
            seriesPoints.push(point);
        },

        updateRange: function(value, series) {
            var chart = this,
                x = value.x,
                y = value.y,
                xAxisName = series.xAxis || PRIMARY,
                yAxisName = series.yAxis || PRIMARY,
                xAxisRange = chart.xAxisRanges[xAxisName],
                yAxisRange = chart.yAxisRanges[yAxisName];

            if (defined(x) && x !== null) {
                xAxisRange = chart.xAxisRanges[xAxisName] =
                    xAxisRange || { min: MAX_VALUE, max: MIN_VALUE };

                xAxisRange.min = math.min(xAxisRange.min, x);
                xAxisRange.max = math.max(xAxisRange.max, x);
            }

            if (defined(y) && y !== null) {
                yAxisRange = chart.yAxisRanges[yAxisName] =
                    yAxisRange || { min: MAX_VALUE, max: MIN_VALUE };

                yAxisRange.min = math.min(yAxisRange.min, y);
                yAxisRange.max = math.max(yAxisRange.max, y);
            }
        },

        createPoint: function(value, series, seriesIx) {
            var chart = this,
                point,
                x = value.x,
                y = value.y;

            if (!defined(x) || x === null || !defined(y) || y === null) {
                return null;
            }

            point = new LinePoint(value,
                deepExtend({
                    markers: {
                        border: {
                            color: series.color
                        },
                        opacity: series.opacity
                    },
                    tooltip: {
                        format: chart.options.tooltip.format
                    },
                    labels: {
                        format: chart.options.labels.format
                    }
                }, series)
            );

            chart.append(point);

            return point;
        },

        seriesAxes: function(series) {
            var plotArea = this.plotArea,
                xAxis = series.xAxis || PRIMARY,
                yAxis = series.yAxis || PRIMARY;

            return {
                x: plotArea.namedXAxes[xAxis],
                y: plotArea.namedYAxes[yAxis]
            };
        },

        reflow: function(targetBox) {
            var chart = this,
                plotArea = chart.plotArea,
                chartPoints = chart.points,
                pointIx = 0,
                point,
                seriesAxes;

            chart.traverseDataPoints(function(value, fields) {
                point = chartPoints[pointIx++];
                seriesAxes = chart.seriesAxes(fields.series);

                var slotX = seriesAxes.x.getSlot(value.x, value.x),
                    slotY = seriesAxes.y.getSlot(value.y, value.y),
                    pointSlot = new Box2D(slotX.x1, slotY.y1, slotX.x2, slotY.y2);

                if (point) {
                    point.reflow(pointSlot);
                }
            });

            chart.box = targetBox;
        },

        getViewElements: function(view) {
            var chart = this,
                elements = ChartElement.fn.getViewElements.call(chart, view),
                group = view.createGroup({
                    animation: {
                        type: CLIP
                    }
                });

            group.children = elements;
            return [group];
        },

        traverseDataPoints: function(callback) {
            var chart = this,
                options = chart.options,
                series = options.series,
                seriesPoints = chart.seriesPoints,
                pointIx = 0,
                seriesIx,
                currentSeries,
                currentSeriesPoints,
                dataItems,
                value,
                pointData;

            for (seriesIx = 0; seriesIx < series.length; seriesIx++) {
                currentSeries = series[seriesIx];

                currentSeriesPoints = seriesPoints[seriesIx];
                if (!currentSeriesPoints) {
                    seriesPoints[seriesIx] = [];
                }

                for (pointIx = 0; pointIx < currentSeries.data.length; pointIx++) {
                    pointData = currentSeries.data[pointIx] || [];
                    dataItems = currentSeries.dataItems;
                    value = { x: pointData[0], y: pointData[1] };

                    callback(value, {
                        pointIx: pointIx,
                        series: currentSeries,
                        seriesIx: seriesIx,
                        dataItem: dataItems ? dataItems[pointIx] : value,
                        owner: chart
                    });
                }
            }
        },

        formatPointValue: function(value, tooltipFormat) {
            return format(tooltipFormat, value.x, value.y);
        }
    });

    var ScatterLineChart = ScatterChart.extend({
        getViewElements: function(view) {
            var chart = this,
                elements = ScatterChart.fn.getViewElements.call(chart, view),
                group = view.createGroup({
                    animation: {
                        type: CLIP
                    }
                }),
                lines = chart.splitSegments(view);

            group.children = lines.concat(elements);
            return [group];
        }
    });
    deepExtend(ScatterLineChart.fn, LineChartMixin);

    var PieSegment = ChartElement.extend({
        init: function(value, sector, options) {
            var segment = this;

            segment.value = value;
            segment.sector = sector;

            ChartElement.fn.init.call(segment, options);
        },

        options: {
            color: WHITE,
            overlay: {
                gradient: ROUNDED_BEVEL
            },
            border: {
                width: 0.5
            },
            labels: {
                visible: false,
                distance: 35,
                font: DEFAULT_FONT,
                margin: getSpacing(0.5),
                align: CIRCLE,
                zIndex: 1,
                position: OUTSIDE_END
            },
            animation: {
                type: PIE
            },
            highlight: {
                visible: true,
                border: {
                    width: 1
                }
            }
        },

        render: function() {
            var segment = this,
                options = segment.options,
                labels = options.labels,
                labelText = segment.value,
                labelTemplate;

            if (segment._rendered) {
                return;
            } else {
                segment._rendered = true;
            }

            if (labels.template) {
                labelTemplate = baseTemplate(labels.template);
                labelText = labelTemplate({
                    dataItem: segment.dataItem,
                    category: segment.category,
                    value: segment.value,
                    series: segment.series,
                    percentage: segment.percentage
                });
            }

            if (labels.visible) {
                segment.label = new TextBox(labelText, deepExtend({}, labels, {
                        id: uniqueId(),
                        align: CENTER,
                        vAlign: "",
                        animation: {
                            type: FADEIN,
                            delay: segment.categoryIx * PIE_SECTOR_ANIM_DELAY
                        }
                    }));

                segment.append(segment.label);
                segment.registerId(segment.label.options.id);
            }
        },

        reflow: function(targetBox) {
            var segment = this;

            segment.render();

            segment.box = targetBox;
            targetBox.clone();

            segment.reflowLabel();
        },

        reflowLabel: function() {
            var segment = this,
                sector = segment.sector.clone(),
                options = segment.options,
                label = segment.label,
                labelsOptions = options.labels,
                labelsDistance = labelsOptions.distance,
                lp,
                x1,
                angle = sector.middle(),
                labelWidth,
                labelHeight;

            if (label) {
                labelHeight = label.box.height();
                labelWidth = label.box.width();
                if (labelsOptions.position == CENTER) {
                    sector.r = math.abs((sector.r - labelHeight) / 2) + labelHeight;
                    lp = sector.point(angle);
                    label.reflow(new Box2D(lp.x, lp.y - labelHeight / 2, lp.x, lp.y));
                } else if (labelsOptions.position == INSIDE_END) {
                    sector.r = sector.r - labelHeight / 2;
                    lp = sector.point(angle);
                    label.reflow(new Box2D(lp.x, lp.y - labelHeight / 2, lp.x, lp.y));
                } else {
                    lp = sector.clone().expand(labelsDistance).point(angle);
                    if (lp.x >= sector.c.x) {
                        x1 = lp.x + labelWidth;
                        label.orientation = RIGHT;
                    } else {
                        x1 = lp.x - labelWidth;
                        label.orientation = LEFT;
                    }
                    label.reflow(new Box2D(x1, lp.y - labelHeight, lp.x, lp.y));
                }
            }
        },

        getViewElements: function(view) {
            var segment = this,
                sector = segment.sector,
                options = segment.options,
                borderOptions = options.border || {},
                border = borderOptions.width > 0 ? {
                    stroke: borderOptions.color,
                    strokeWidth: borderOptions.width,
                    dashType: borderOptions.dashType
                } : {},
                elements = [],
                overlay = options.overlay;

            if (overlay) {
                overlay = deepExtend({}, options.overlay, {
                    r: sector.r,
                    cx: sector.c.x,
                    cy: sector.c.y
                })
            }

            if (segment.value !== 0) {
                elements.push(view.createSector(sector, deepExtend({
                    id: options.id,
                    fill: options.color,
                    overlay: overlay,
                    fillOpacity: options.opacity,
                    strokeOpacity: options.opacity,
                    animation: deepExtend(options.animation, {
                        delay: segment.categoryIx * PIE_SECTOR_ANIM_DELAY
                    })
                }, border)));
            }

            append(elements,
                ChartElement.fn.getViewElements.call(segment, view)
            );

            return elements;
        },

        getOutlineElement: function(view, options) {
            var segment = this,
                highlight = segment.options.highlight || {},
                border = highlight.border || {},
                outlineId = segment.options.id + OUTLINE_SUFFIX,
                element;

            segment.registerId(outlineId);
            options = deepExtend({}, options, { id: outlineId });

            if (segment.value !== 0) {
                element = view.createSector(segment.sector, deepExtend({}, options, {
                    fill: highlight.color,
                    fillOpacity: highlight.opacity,
                    strokeOpacity: border.opacity,
                    strokeWidth: border.width,
                    stroke: border.color
                }));
            }

            return element;
        },

        tooltipAnchor: function(tooltipWidth, tooltipHeight) {
            var w = tooltipWidth / 2,
                h = tooltipHeight / 2,
                r = math.sqrt((w * w) + (h * h)),
                sector = this.sector.clone().expand(r + TOOLTIP_OFFSET),
                tooltipCenter = sector.point(sector.middle());

            return new Point2D(tooltipCenter.x - w, tooltipCenter.y - h);
        },

        formatPointValue: function(format) {
            var point = this;

            return point.owner.formatPointValue(point.value, format);
        }
    });

    var PieChart = ChartElement.extend({
        init: function(plotArea, options) {
            var chart = this;

            ChartElement.fn.init.call(chart, options);

            chart.plotArea = plotArea;
            chart.segments = [];
            chart.seriesPoints = [];
            chart.render();
        },

        options: {
            startAngle: 90,
            padding: 60,
            connectors: {
                width: 1,
                color: "#939393",
                padding: 4
            }
        },

        render: function() {
            var chart = this;

            chart.traverseDataPoints(proxy(chart.addValue, chart));
        },

        traverseDataPoints: function(callback) {
            var chart = this,
                options = chart.options,
                colors = chart.plotArea.options.seriesColors || [],
                startAngle = options.startAngle,
                colorsCount = colors.length,
                series = options.series,
                dataItems,
                currentName,
                currentSeries,
                currentData,
                seriesIx,
                angle,
                data,
                anglePerValue,
                value,
                explode,
                total,
                i;

            for (seriesIx = 0; seriesIx < series.length; seriesIx++) {
                currentSeries = series[seriesIx];
                dataItems = currentSeries.dataItems;
                data = currentSeries.data;
                total = chart.pointsTotal(data)
                anglePerValue = 360 / total;

                for (i = 0; i < data.length; i++) {
                    currentData = chart.pointData(currentSeries, i);
                    value = currentData.value;
                    angle = round(value * anglePerValue, DEFAULT_PRECISION);
                    currentName = currentData.category;
                    explode = data.length != 1 && !!currentData.explode;
                    currentSeries.color = currentData.color ?
                        currentData.color : colors[i % colorsCount];

                    callback(value, new Sector(null, 0, startAngle, angle), {
                        owner: chart,
                        category: currentName,
                        categoryIx: i,
                        series: currentSeries,
                        seriesIx: seriesIx,
                        dataItem: dataItems ? dataItems[i] : { value: currentData },
                        percentage: value / total,
                        explode: explode,
                        currentData: currentData
                    });

                    startAngle += angle;
                }
            }
        },

        addValue: function(value, sector, fields) {
            var chart = this,
                segment;

            segment = new PieSegment(value, sector, fields.series);
            segment.options.id = uniqueId();
            extend(segment, fields);
            chart.append(segment);
            chart.segments.push(segment);
        },

        pointValue: function(point) {
            return defined(point.value) ? point.value : point;
        },

        pointData: function(series, index) {
            var chart = this,
                data = series.data[index];

            return {
                value: chart.pointValue(data),
                category: chart.pointGetter(series, index, "category"),
                color: chart.pointGetter(series, index, "color"),
                explode: chart.pointGetter(series, index, "explode")
            };
        },

        pointGetter: function(series, index, prop) {
            var valueField = series[prop + "Field"],
                data = series.data[index],
                value = data[prop];

            if (valueField && series.dataItems) {
                return getField(valueField, series.dataItems[index]);
            } else {
                return defined(value) ? value : "";
            }
        },

        pointsTotal: function(data) {
            var chart = this,
                length = data.length,
                sum = 0,
                i;

            for(i = 0; i < length; i++) {
                sum += chart.pointValue(data[i]);
            }

            return sum;
        },

        reflow: function(targetBox) {
            var chart = this,
                options = chart.options,
                box = targetBox.clone(),
                minWidth = math.min(box.width(), box.height()),
                space = 5,
                padding = options.padding > minWidth / 2 - space ? minWidth / 2 - space : options.padding,
                newBox = new Box2D(box.x1, box.y1,
                    box.x1 + minWidth, box.y1 + minWidth),
                newBoxCenter = newBox.center(),
                boxCenter = box.center(),
                segments = chart.segments,
                count = segments.length,
                leftSideLabels = [],
                rightSideLabels = [],
                label,
                segment,
                sector,
                i;

            newBox.translate(boxCenter.x - newBoxCenter.x, boxCenter.y - newBoxCenter.y);

            for (i = 0; i < count; i++) {
                segment = segments[i];

                sector = segment.sector;
                sector.r = minWidth / 2 - padding;
                sector.c = new Point2D(
                    sector.r + newBox.x1 + padding,
                    sector.r + newBox.y1 + padding
                );

                if (segment.explode) {
                    sector.c = sector.clone().radius(sector.r * 0.15).point(sector.middle());
                }

                segment.reflow(newBox);

                label = segment.label;
                if (label) {
                    if (label.options.position === OUTSIDE_END) {
                        if (label.orientation === RIGHT) {
                            rightSideLabels.push(label);
                        } else {
                            leftSideLabels.push(label);
                        }
                    }
                }
            }

            if (leftSideLabels.length > 0) {
                leftSideLabels.sort(chart.labelComparator(true));
                chart.leftLabelsReflow(leftSideLabels);
            }

            if (rightSideLabels.length > 0) {
                rightSideLabels.sort(chart.labelComparator(false));
                chart.rightLabelsReflow(rightSideLabels);
            }

            chart.box = newBox;
        },

        leftLabelsReflow: function(labels) {
            var chart = this,
                distances = chart.distanceBetweenLabels(labels);

            chart.distributeLabels(distances, labels);
        },

        rightLabelsReflow: function(labels) {
            var chart = this,
                distances = chart.distanceBetweenLabels(labels);

            chart.distributeLabels(distances, labels);
        },

        distanceBetweenLabels: function(labels) {
            var chart = this,
                segment = chart.segments[0],
                sector = segment.sector,
                firstBox = labels[0].box,
                secondBox,
                count = labels.length - 1,
                distances = [],
                distance,
                lr = sector.r + segment.options.labels.distance,
                i;

            distance = round(firstBox.y1 - (sector.c.y - lr - firstBox.height() - firstBox.height() / 2));
            distances.push(distance);
            for (i = 0; i < count; i++) {
                firstBox = labels[i].box;
                secondBox = labels[i + 1].box;
                distance = round(secondBox.y1 - firstBox.y2);
                distances.push(distance);
            }
            distance = round(sector.c.y + lr - labels[count].box.y2 - labels[count].box.height() / 2);
            distances.push(distance);

            return distances;
        },

        distributeLabels: function(distances, labels) {
            var chart = this,
                count = distances.length,
                remaining,
                left,
                right,
                i;

            for (i = 0; i < count; i++) {
                left = right = i;
                remaining = -distances[i];
                while(remaining > 0 && (left >= 0 || right < count)) {
                    remaining = chart._takeDistance(distances, i, --left, remaining);
                    remaining = chart._takeDistance(distances, i, ++right, remaining);
                }
            }

            chart.reflowLabels(distances, labels);
        },

        _takeDistance: function(distances, anchor, position, amount) {
            if (distances[position] > 0) {
                var available = math.min(distances[position], amount);
                amount -= available;
                distances[position] -= available;
                distances[anchor] += available;
            }

            return amount;
        },

        reflowLabels: function(distances, labels) {
            var chart = this,
                segments = chart.segments,
                segment = segments[0],
                sector = segment.sector,
                labelsCount = labels.length,
                labelOptions = segment.options.labels,
                labelDistance = labelOptions.distance,
                boxY = sector.c.y - (sector.r + labelDistance) - labels[0].box.height(),
                label,
                boxX,
                box,
                i;

            distances[0] += 2;
            for (i = 0; i < labelsCount; i++) {
                label = labels[i];
                boxY += distances[i];
                box = label.box;
                boxX = chart.hAlignLabel(
                    box.x2,
                    sector.clone().expand(labelDistance),
                    boxY,
                    boxY + box.height(),
                    label.orientation == RIGHT);

                if (label.orientation == RIGHT) {
                    if (labelOptions.align !== CIRCLE) {
                        boxX = sector.r + sector.c.x + labelDistance;
                    }
                    label.reflow(new Box2D(boxX + box.width(), boxY,
                        boxX, boxY));
                } else {
                    if (labelOptions.align !== CIRCLE) {
                        boxX = sector.c.x - sector.r - labelDistance;
                    }
                    label.reflow(new Box2D(boxX - box.width(), boxY,
                        boxX, boxY));
                }

                boxY += box.height();
            }
        },

        getViewElements: function(view) {
            var chart = this,
                options = chart.options,
                connectors = options.connectors,
                segments = chart.segments,
                connectorLine,
                sector,
                count = segments.length,
                space = 4,
                angle,
                lines = [],
                points,
                segment,
                seriesIx,
                label,
                i;

            for (i = 0; i < count; i++) {
                segment = segments[i];
                sector = segment.sector;
                angle = sector.middle();
                label = segment.label;
                seriesIx = { seriesId: segment.seriesIx };

                if (label) {
                    points = [];
                    if (label.options.position === OUTSIDE_END && segment.value !== 0) {
                        var box = label.box,
                            centerPoint = sector.c,
                            start = sector.point(angle),
                            middle = new Point2D(box.x1, box.center().y),
                            sr,
                            end,
                            crossing;

                        start = sector.clone().expand(connectors.padding).point(angle);
                        points.push(start);
                        if (label.orientation == RIGHT) {
                            end = new Point2D(box.x1 - connectors.padding, box.center().y);
                            crossing = intersection(centerPoint, start, middle, end);
                            middle = new Point2D(end.x - space, end.y);
                            crossing = crossing || middle;
                            crossing.x = math.min(crossing.x, middle.x);

                            if (chart.pointInCircle(crossing, sector.c, sector.r + space) ||
                                crossing.x < sector.c.x) {
                                sr = sector.c.x + sector.r + space;
                                if (segment.options.labels.align !== COLUMN) {
                                    if (sr < middle.x) {
                                        points.push(new Point2D(sr, start.y));
                                    } else {
                                        points.push(new Point2D(start.x + space * 2, start.y));
                                    }
                                } else {
                                    points.push(new Point2D(sr, start.y));
                                }
                                points.push(new Point2D(middle.x, end.y));
                            } else {
                                crossing.y = end.y;
                                points.push(crossing);
                            }
                        } else {
                            end = new Point2D(box.x2 + connectors.padding, box.center().y);
                            crossing = intersection(centerPoint, start, middle, end);
                            middle = new Point2D(end.x + space, end.y);
                            crossing = crossing || middle;
                            crossing.x = math.max(crossing.x, middle.x);

                            if (chart.pointInCircle(crossing, sector.c, sector.r + space) ||
                                crossing.x > sector.c.x) {
                                sr = sector.c.x - sector.r - space;
                                if (segment.options.labels.align !== COLUMN) {
                                    if (sr > middle.x) {
                                        points.push(new Point2D(sr, start.y));
                                    } else {
                                        points.push(new Point2D(start.x - space * 2, start.y));
                                    }
                                } else {
                                    points.push(new Point2D(sr, start.y));
                                }
                                points.push(new Point2D(middle.x, end.y));
                            } else {
                                crossing.y = end.y;
                                points.push(crossing);
                            }
                        }

                        points.push(end);
                        connectorLine = view.createPolyline(points, false, {
                            id: uniqueId(),
                            stroke: connectors.color,
                            strokeWidth: connectors.width,
                            animation: {
                                type: FADEIN,
                                delay: segment.categoryIx * PIE_SECTOR_ANIM_DELAY
                            }
                        });
                        lines.push(connectorLine);
                        segment.registerId(connectorLine.options.id, seriesIx);
                    }
                    segment.registerId(label.options.id, seriesIx);
                }

                segment.registerId(segment.options.id, seriesIx);
            }

            append(lines,
                ChartElement.fn.getViewElements.call(chart, view));

            return lines;
        },

        labelComparator: function (reverse) {
            reverse = (reverse) ? -1 : 1;

            return function(a, b) {
                a = (a.parent.sector.middle() + 270) % 360;
                b = (b.parent.sector.middle() + 270) % 360;
                return (a - b) * reverse;
            }
        },

        hAlignLabel: function(originalX, sector, y1, y2, direction) {
            var cx = sector.c.x,
                cy = sector.c.y,
                r = sector.r,
                t = math.min(math.abs(cy - y1), math.abs(cy - y2));

            if (t > r) {
                return originalX;
            } else {
                return cx + math.sqrt((r * r) - (t * t)) * (direction ? 1 : -1);
            }
        },

        pointInCircle: function(point, c, r) {
            return sqr(c.x - point.x) + sqr(c.y - point.y) < sqr(r);
        },

        formatPointValue: function(value, tooltipFormat) {
            return format(tooltipFormat, value);
        }
    });

    var PlotAreaBase = ChartElement.extend({
        init: function(series, options) {
            var plotArea = this;

            ChartElement.fn.init.call(plotArea, options);

            plotArea.series = series;
            plotArea.charts = [];
            plotArea.options.legend.items = [];
            plotArea.axes = [];

            plotArea.render();
        },

        options: {
            series: [],
            plotArea: {
                margin: {}
            },
            background: "",
            border: {
                color: BLACK,
                width: 0
            },
            legend: {}
        },

        appendChart: function(chart) {
            var plotArea = this;

            plotArea.charts.push(chart);
            plotArea.addToLegend(chart);
            plotArea.append(chart);
        },

        addToLegend: function(chart) {
            var series = chart.options.series,
                count = series.length,
                data = [],
                i;

            for (i = 0; i < count; i++) {
                data.push({ name: series[i].name || "", color: series[i].color });
            }

            append(this.options.legend.items, data);
        },

        reflow: function(targetBox) {
            var plotArea = this,
                options = plotArea.options.plotArea,
                margin = getSpacing(options.margin);

            plotArea.box = targetBox.clone();

            plotArea.box.unpad(margin);

            if (plotArea.axes.length > 0) {
                plotArea.reflowAxes();
                plotArea.box = plotArea.axisBox();
            }

            plotArea.reflowCharts();
        },

        axisCrossingValues: function(axis, crossingAxes) {
            var options = axis.options,
                crossingValues = [].concat(options.axisCrossingValue),
                valuesToAdd = crossingAxes.length - crossingValues.length,
                defaultValue = crossingValues[0] || 0,
                i;

            for (i = 0; i < valuesToAdd; i++) {
                crossingValues.push(defaultValue);
            }

            return crossingValues;
        },

        alignAxisTo: function(axis, targetAxis, crossingValue, targetCrossingValue) {
            var slot = axis.getSlot(crossingValue, crossingValue),
                targetSlot = targetAxis.getSlot(targetCrossingValue, targetCrossingValue);

            axis.reflow(
                axis.box.translate(
                    targetSlot.x1 - slot.x1,
                    targetSlot.y1 - slot.y1
                )
            );
        },

        alignAxes: function(xAxes, yAxes) {
            var plotArea = this,
                xAnchor = xAxes[0],
                yAnchor = yAxes[0],
                xAnchorCrossings = plotArea.axisCrossingValues(xAnchor, yAxes),
                yAnchorCrossings = plotArea.axisCrossingValues(yAnchor, xAxes),
                leftAnchor,
                rightAnchor,
                topAnchor,
                bottomAnchor,
                axis,
                axisCrossings,
                i;

            // TODO: Refactor almost-identical loops
            for (i = 0; i < yAxes.length; i++) {
                axis = yAxes[i];
                plotArea.alignAxisTo(axis, xAnchor, yAnchorCrossings[i], xAnchorCrossings[i]);

                if (axis.lineBox().x1 === xAnchor.lineBox().x1) {
                    if (leftAnchor) {
                        axis.reflow(axis.box
                            .alignTo(leftAnchor.box, LEFT)
                            .translate(-axis.options.margin, 0)
                        );
                    }

                    leftAnchor = axis;
                }

                if (axis.lineBox().x2 === xAnchor.lineBox().x2) {
                    if (!axis._mirrored) {
                        axis.options.labels.mirror = !axis.options.labels.mirror;
                        axis._mirrored = true;
                    }
                    plotArea.alignAxisTo(axis, xAnchor, yAnchorCrossings[i], xAnchorCrossings[i]);

                    if (rightAnchor) {
                        axis.reflow(axis.box
                            .alignTo(rightAnchor.box, RIGHT)
                            .translate(axis.options.margin, 0)
                        );
                    }

                    rightAnchor = axis;
                }
            }

            for (i = 0; i < xAxes.length; i++) {
                axis = xAxes[i];
                plotArea.alignAxisTo(axis, yAnchor, xAnchorCrossings[i], yAnchorCrossings[i]);

                if (axis.lineBox().y1 === yAnchor.lineBox().y1) {
                    if (!axis._mirrored) {
                        axis.options.labels.mirror = !axis.options.labels.mirror;
                        axis._mirrored = true;
                    }
                    plotArea.alignAxisTo(axis, yAnchor, xAnchorCrossings[i], yAnchorCrossings[i]);

                    if (topAnchor) {
                        axis.reflow(axis.box
                            .alignTo(topAnchor.box, TOP)
                            .translate(0, -axis.options.margin)
                        );
                    }

                    topAnchor = axis;
                }

                if (axis.lineBox().y2 === yAnchor.lineBox().y2) {
                    if (bottomAnchor) {
                        axis.reflow(axis.box
                            .alignTo(bottomAnchor.box, BOTTOM)
                            .translate(0, axis.options.margin)
                        );
                    }

                    bottomAnchor = axis;
                }
            }
        },

        axisBox: function() {
            var plotArea = this,
                axes = plotArea.axes,
                box = axes[0].box.clone(),
                i,
                length = axes.length;

            for (i = 1; i < length; i++) {
                box.wrap(axes[i].box);
            }

            return box;
        },

        shrinkAxes: function() {
            var plotArea = this,
                box = plotArea.box,
                axisBox = plotArea.axisBox(),
                overflowY = axisBox.height() - box.height(),
                overflowX = axisBox.width() - box.width(),
                axes = plotArea.axes,
                currentAxis,
                isVertical,
                i,
                length = axes.length;

            // Shrink all axes so they don't overflow out of the bounding box
            for (i = 0; i < length; i++) {
                currentAxis = axes[i];
                isVertical = currentAxis.options.isVertical;

                currentAxis.reflow(
                    currentAxis.box.shrink(
                        isVertical ? 0 : overflowX,
                        isVertical ? overflowY : 0
                    )
                );
            }
        },

        shrinkAdditionalAxes: function(xAxes, yAxes) {
            var plotArea = this,
                axes = plotArea.axes,
                xAnchor = xAxes[0],
                yAnchor = yAxes[0],
                anchorLineBox = xAnchor.lineBox().clone().wrap(yAnchor.lineBox()),
                overflowX,
                overflowY,
                currentAxis,
                isVertical,
                lineBox,
                i,
                length = axes.length;

            for (i = 0; i < length; i++) {
                currentAxis = axes[i];
                isVertical = currentAxis.options.isVertical;
                lineBox = currentAxis.lineBox();

                overflowX = math.max(0, lineBox.x2 - anchorLineBox.x2) +
                            math.max(0, anchorLineBox.x1 - lineBox.x1);

                overflowY = math.max(0, lineBox.y2 - anchorLineBox.y2) +
                            math.max(0, anchorLineBox.y1 - lineBox.y1);

                currentAxis.reflow(
                    currentAxis.box.shrink(
                        isVertical ? 0 : overflowX,
                        isVertical ? overflowY : 0
                    )
                );
            }
        },

        fitAxes: function() {
            var plotArea = this,
                axes = plotArea.axes,
                box = plotArea.box,
                axisBox = plotArea.axisBox(),
                offsetX = box.x1 - axisBox.x1,
                offsetY = box.y1 - axisBox.y1,
                currentAxis,
                i,
                length = axes.length;

            for (i = 0; i < length; i++) {
                currentAxis = axes[i];

                currentAxis.reflow(
                    currentAxis.box.translate(offsetX, offsetY)
                );
            }
        },

        reflowAxes: function() {
            var plotArea = this,
                axes = plotArea.axes,
                xAxes = grep(axes, (function(axis) { return !axis.options.isVertical; })),
                yAxes = grep(axes, (function(axis) { return axis.options.isVertical; })),
                i,
                length = axes.length;

            for (i = 0; i < length; i++) {
                axes[i].reflow(plotArea.box);
            }

            plotArea.alignAxes(xAxes, yAxes);
            plotArea.shrinkAdditionalAxes(xAxes, yAxes);
            plotArea.alignAxes(xAxes, yAxes);
            plotArea.shrinkAxes();
            plotArea.alignAxes(xAxes, yAxes);
            plotArea.fitAxes();
        },

        reflowCharts: function() {
            var plotArea = this,
                charts = plotArea.charts,
                count = charts.length,
                box = plotArea.box,
                i;

            for (i = 0; i < count; i++) {
                charts[i].reflow(box);
            }

            plotArea.box = box;
        },

        renderGridLines: function(view, axis, secondaryAxis) {
            var options = axis.options,
                isVertical = options.isVertical,
                crossingSlot = axis.getSlot(options.axisCrossingValue),
                secAxisPos = round(crossingSlot[isVertical ? "y1" : "x1"]),
                lineBox = secondaryAxis.lineBox(),
                lineStart = lineBox[isVertical ? "x1" : "y1"],
                lineEnd = lineBox[isVertical ? "x2" : "y2" ],
                majorTicks = axis.getMajorTickPositions(),
                gridLines = [],
                gridLine = function (pos, options) {
                    return {
                        pos: pos,
                        options: options
                    };
                };

            if (options.majorGridLines.visible) {
                gridLines = map(majorTicks, function(pos) {
                                return gridLine(pos, options.majorGridLines);
                            });
            }

            if (options.minorGridLines.visible) {
                gridLines = gridLines.concat(
                    map(axis.getMinorTickPositions(), function(pos) {
                        if (options.majorGridLines.visible) {
                            if (!inArray(pos, majorTicks)) {
                                return gridLine(pos, options.minorGridLines);
                            }
                        } else {
                            return gridLine(pos, options.minorGridLines);
                        }
                    }
                ));
            }

            return map(gridLines, function(line) {
                var gridLineOptions = {
                        strokeWidth: line.options.width,
                        stroke: line.options.color,
                        dashType: line.options.dashType
                    },
                    linePos = round(line.pos);

                if (secAxisPos === linePos && secondaryAxis.options.line.visible) {
                    return null;
                }

                if (isVertical) {
                    return view.createLine(
                        lineStart, linePos, lineEnd, linePos,
                        gridLineOptions);
                } else {
                    return view.createLine(
                        linePos, lineStart, linePos, lineEnd,
                        gridLineOptions);
                }
            });
        },

        getViewElements: function(view) {
            var plotArea = this,
                options = plotArea.options.plotArea,
                axisY = plotArea.axisY,
                axisX = plotArea.axisX,
                gridLinesY = axisY ? plotArea.renderGridLines(view, axisY, axisX) : [],
                gridLinesX = axisX ? plotArea.renderGridLines(view, axisX, axisY) : [],
                childElements = ChartElement.fn.getViewElements.call(plotArea, view),
                border = options.border || {},
                elements = [
                    view.createRect(plotArea.box, {
                        fill: options.background,
                        zIndex: -1
                    }),
                    view.createRect(plotArea.box, {
                        stroke: border.width ? border.color : "",
                        strokeWidth: border.width,
                        fill: "",
                        zIndex: 0,
                        dashType: border.dashType
                    })
                ];

            return [].concat(gridLinesY, gridLinesX, childElements, elements);
        }
    });

    var CategoricalPlotArea = PlotAreaBase.extend({
        init: function(series, options) {
            var plotArea = this,
                axisOptions = deepExtend({}, plotArea.options, options);

            plotArea.namedValueAxes = {};
            plotArea.valueAxisRangeTracker = new AxisGroupRangeTracker(axisOptions.valueAxis);

            if (series.length > 0) {
                plotArea.invertAxes = inArray(
                    series[0].type, [BAR, VERTICAL_LINE, VERTICAL_AREA]
                );
            }

            PlotAreaBase.fn.init.call(plotArea, series, options);
        },

        options: {
            categoryAxis: {
                categories: []
            },
            valueAxis: {}
        },

        render: function() {
            var plotArea = this,
                series = plotArea.series;

            plotArea.createBarChart(grep(series, function(s) {
                return inArray(s.type, [BAR, COLUMN]);
            }));

            plotArea.createLineChart(grep(series, function(s) {
                return inArray(s.type, [LINE, VERTICAL_LINE]);
            }));

            plotArea.createAreaChart(grep(series, function(s) {
                return inArray(s.type, [AREA, VERTICAL_AREA]);
            }));

            plotArea.createAxes();
        },

        appendChart: function(chart) {
            var plotArea = this,
                options = plotArea.options,
                series = chart.options.series,
                categories = options.categoryAxis.categories,
                categoriesToAdd = math.max(0, categoriesCount(series) - categories.length);

            append(categories, new Array(categoriesToAdd));

            plotArea.valueAxisRangeTracker.update(chart.valueAxisRanges);

            PlotAreaBase.fn.appendChart.call(plotArea, chart);
        },

        createBarChart: function(series) {
            if (series.length === 0) {
                return;
            }

            var plotArea = this,
                options = plotArea.options,
                firstSeries = series[0],
                barChart = new BarChart(plotArea, {
                    series: series,
                    invertAxes: plotArea.invertAxes,
                    isStacked: firstSeries.stack,
                    gap: firstSeries.gap,
                    spacing: firstSeries.spacing
                });

            plotArea.appendChart(barChart);
        },

        createLineChart: function(series) {
            if (series.length === 0) {
                return;
            }

            var plotArea = this,
                options = plotArea.options,
                firstSeries = series[0],
                lineChart = new LineChart(plotArea, {
                    invertAxes: plotArea.invertAxes,
                    isStacked: firstSeries.stack,
                    series: series
                });

            plotArea.appendChart(lineChart);
        },

        createAreaChart: function(series) {
            if (series.length === 0) {
                return;
            }

            var plotArea = this,
                options = plotArea.options,
                firstSeries = series[0],
                areaChart = new AreaChart(plotArea, {
                    invertAxes: plotArea.invertAxes,
                    isStacked: firstSeries.stack,
                    series: series
                });

            plotArea.appendChart(areaChart);
        },

        createAxes: function() {
            var plotArea = this,
                options = plotArea.options,
                range,
                invertAxes = plotArea.invertAxes,
                categoriesCount = options.categoryAxis.categories.length,
                categoryAxis = new CategoryAxis(deepExtend({
                        isVertical: invertAxes,
                        axisCrossingValue: invertAxes ? categoriesCount : 0
                    },
                    options.categoryAxis)
                ),
                axis,
                axisName,
                namedValueAxes = plotArea.namedValueAxes,
                valueAxisOptions = [].concat(options.valueAxis),
                primaryValueAxis;

            each(valueAxisOptions, function() {
                axisName = this.name || PRIMARY;
                range = plotArea.valueAxisRangeTracker.query(axisName);

                axis = namedValueAxes[axisName] =
                    new NumericAxis(range.min, range.max, deepExtend({
                        isVertical: !invertAxes
                    },
                    this)
                );

                plotArea.axes.push(axis);
                plotArea.append(axis);
            });

            primaryValueAxis = namedValueAxes[PRIMARY] || plotArea.axes[0];

            // TODO: Consider removing axisX and axisY aliases
            plotArea.axisX = invertAxes ? primaryValueAxis : categoryAxis;
            plotArea.axisY = invertAxes ? categoryAxis : primaryValueAxis;

            plotArea.categoryAxis = categoryAxis;
            plotArea.axes.push(categoryAxis);
            plotArea.append(plotArea.categoryAxis);
        }
    });

    var AxisGroupRangeTracker = Class.extend({
        init: function(axisOptions) {
            var tracker = this;

            tracker.axisRanges = {},
            tracker.axisOptions = [].concat(axisOptions),
            tracker.defaultRange = { min: 0, max: 1 };
        },

        update: function(chartAxisRanges) {
            var tracker = this,
                axisRanges = tracker.axisRanges,
                axisOptions = tracker.axisOptions,
                range,
                chartRange,
                i,
                axis,
                axisName,
                length = axisOptions.length;

            if (!chartAxisRanges) {
                return;
            }

            for (i = 0; i < length; i++) {
                axis = axisOptions[i];
                axisName = axis.name || PRIMARY;
                range = axisRanges[axisName];
                chartRange = chartAxisRanges[axisName];
                if (chartRange) {
                    axisRanges[axisName] = range =
                        range || { min: MAX_VALUE, max: MIN_VALUE };

                    range.min = math.min(range.min, chartRange.min);
                    range.max = math.max(range.max, chartRange.max);
                }
            }
        },

        query: function(axisName) {
            var tracker = this;

            return tracker.axisRanges[axisName] || deepExtend({}, tracker.defaultRange);
        }
    });

    var XYPlotArea = PlotAreaBase.extend({
        init: function(series, options) {
            var plotArea = this,
                axisOptions = deepExtend({}, plotArea.options, options);

            plotArea.namedXAxes = {};
            plotArea.namedYAxes = {};

            plotArea.xAxisRangeTracker = new AxisGroupRangeTracker(axisOptions.xAxis);
            plotArea.yAxisRangeTracker = new AxisGroupRangeTracker(axisOptions.yAxis);

            PlotAreaBase.fn.init.call(plotArea, series, options);
        },

        options: {
            xAxis: {},
            yAxis: {}
        },

        render: function() {
            var plotArea = this,
                series = plotArea.series;

            plotArea.createScatterChart(grep(series, function(s) {
                return s.type === SCATTER;
            }));

            plotArea.createScatterLineChart(grep(series, function(s) {
                return s.type === SCATTER_LINE;
            }));

            plotArea.createAxes();
        },

        appendChart: function(chart) {
            var plotArea = this;

            plotArea.xAxisRangeTracker.update(chart.xAxisRanges);
            plotArea.yAxisRangeTracker.update(chart.yAxisRanges);

            PlotAreaBase.fn.appendChart.call(plotArea, chart);
        },

        createScatterChart: function(series) {
            var plotArea = this;

            if (series.length > 0) {
                plotArea.appendChart(
                    new ScatterChart(plotArea, { series: series })
                );
            }
        },

        createScatterLineChart: function(series) {
            var plotArea = this;

            if (series.length > 0) {
                plotArea.appendChart(
                    new ScatterLineChart(plotArea, { series: series })
                );
            }
        },

        createXYAxis: function(options, isVertical) {
            var plotArea = this,
                axisName = options.name || PRIMARY,
                namedAxes = isVertical ? plotArea.namedYAxes : plotArea.namedXAxes,
                axisRanges = isVertical ? plotArea.yAxisRanges : plotArea.xAxisRanges,
                rangeTracker = isVertical ? plotArea.yAxisRangeTracker : plotArea.xAxisRangeTracker,
                range = rangeTracker.query(axisName),
                options = deepExtend({}, options, { isVertical: isVertical }),
                axis = new NumericAxis(range.min, range.max, options);

            namedAxes[axisName] = axis;
            plotArea.append(axis);
            plotArea.axes.push(axis);
        },

        createAxes: function() {
            var plotArea = this,
                options = plotArea.options,
                xAxesOptions = [].concat(options.xAxis),
                yAxesOptions = [].concat(options.yAxis);

            each(xAxesOptions, function() {
                plotArea.createXYAxis(this, false);
            });

            each(yAxesOptions, function() {
                plotArea.createXYAxis(this, true);
            });

            // TODO: Remove axisX and axisY aliases
            plotArea.axisX = plotArea.namedXAxes.primary || plotArea.namedXAxes[xAxesOptions[0].name];
            plotArea.axisY = plotArea.namedYAxes.primary || plotArea.namedYAxes[yAxesOptions[0].name];
        }
    });

    var PiePlotArea = PlotAreaBase.extend({
        render: function() {
            var plotArea = this,
                series = plotArea.series;

            plotArea.createPieChart(series);
        },

        createPieChart: function(series) {
            var plotArea = this,
                firstSeries = series[0],
                pieChart = new PieChart(plotArea, {
                    series: series,
                    padding: firstSeries.padding,
                    startAngle: firstSeries.startAngle,
                    connectors: firstSeries.connectors
                });

            plotArea.appendChart(pieChart);
        },

        addToLegend: function(chart) {
            var plotArea = this,
                options = plotArea.options,
                segments = chart.segments,
                count = segments.length,
                i;

            for (i = 0; i < count; i++) {
                options.legend.items.push({
                    name: segments[i].category,
                    color: segments[i].options.color });
            }
        }
    });

    // **************************
    // Visual elements
    // **************************

    var ViewElement = Class.extend({
        init: function(options) {
            var element = this;
            element.children = [];
            element.options = deepExtend({}, element.options, options);
        },

        render: function() {
            return this.template(this);
        },

        renderContent: function() {
            var element = this,
                output = "",
                sortedChildren = element.sortChildren(),
                childrenCount = sortedChildren.length,
                i;

            for (i = 0; i < childrenCount; i++) {
                output += sortedChildren[i].render();
            }

            return output;
        },

        sortChildren: function() {
            var element = this,
                children = element.children,
                length,
                i;

            for (i = 0, length = children.length; i < length; i++) {
                children[i]._childIndex = i;
            }

            return children.slice(0).sort(element.compareChildren);
        },

        compareChildren: function(a, b) {
            var aValue = a.options.zIndex || 0,
                bValue = b.options.zIndex || 0;

            if (aValue !== bValue) {
                return aValue - bValue;
            }

            return a._childIndex - b._childIndex;
        },

        renderAttr: function (name, value) {
            return defined(value) ? " " + name + "='" + value + "' " : "";
        }
    });

    var ViewBase = ViewElement.extend({
        init: function(options) {
            var view = this;

            ViewElement.fn.init.call(view, options);

            view.definitions = {};
            view.decorators = [];
            view.animations = [];
        },

        renderDefinitions: function() {
            var view = this,
                definitions = view.definitions,
                definitionId,
                output = "";

            for (definitionId in definitions) {
                if (definitions.hasOwnProperty(definitionId)) {
                    output += definitions[definitionId].render();
                }
            }

            return output;
        },

        decorate: function(element) {
            var view = this,
                decorators = view.decorators,
                i,
                length = decorators.length,
                currentDecorator;

            for (i = 0; i < length; i++) {
                currentDecorator = decorators[i];
                view._decorateChildren(currentDecorator, element);
                element = currentDecorator.decorate.call(currentDecorator, element);
            }

            return element;
        },

        _decorateChildren: function(decorator, element) {
            var view = this,
                children = element.children,
                i,
                length = children.length;

            for (i = 0; i < length; i++) {
                view._decorateChildren(decorator, children[i]);
                children[i] = decorator.decorate.call(decorator, children[i]);
            }
        },

        setupAnimations: function() {
            var animations = this.animations,
                i,
                count = animations.length;

            for (i = 0; i < count; i++) {
                animations[i].setup();
            }
        },

        playAnimations: function() {
            var view = this,
                anim;

            while(anim = view.animations.shift()) {
                anim.play();
            }
        },

        buildGradient: function(options) {
            var view = this,
                cache = view._gradientCache,
                hashCode,
                overlay,
                definition;

            if (!cache) {
                cache = view._gradientCache = [];
            }

            if (options) {
                hashCode = getHash(options);
                overlay = cache[hashCode];
                definition = Chart.Gradients[options.gradient];
                if (!overlay && definition) {
                    overlay = deepExtend({ id: uniqueId() }, definition, options);
                    cache[hashCode] = overlay;
                }
            }

            return overlay;
        }
    });

    function supportsSVG() {
        return doc.implementation.hasFeature(
            "http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1");
    }

    // Animations
    var BarAnimationDecorator = Class.extend({
        init: function(view) {
            this.view = view;
        },

        decorate: function(element) {
            var decorator = this,
                view = decorator.view,
                animation = element.options.animation;

            if (animation && view.options.transitions) {
                if (animation.type === BAR) {
                    view.animations.push(
                        new BarAnimation(element)
                    );
                }
            }

            return element;
        }
    });

    var PieAnimationDecorator = Class.extend({
        init: function(view) {
            this.view = view;
        },

        decorate: function(element) {
            var decorator = this,
                view = decorator.view,
                animation = element.options.animation;

            if (animation && animation.type === PIE && view.options.transitions) {
                view.animations.push(
                    new PieAnimation(element, animation)
                );
            }

            return element;
        }
    });

    var FadeAnimationDecorator = Class.extend({
        init: function(view) {
            this.view = view;
        },

        decorate: function(element) {
            var decorator = this,
                view = decorator.view,
                options = view.options,
                animation = element.options.animation;

            if (animation && animation.type === FADEIN && options.transitions) {
                view.animations.push(
                    new FadeAnimation(element, animation)
                );
            }

            return element;
        }
    });

    var ElementAnimation = Class.extend({
        init: function(element, options) {
            var anim = this;

            anim.options = deepExtend({}, anim.options, options);
            anim.element = element;
        },

        options: {
            duration: INITIAL_ANIMATION_DURATION,
            easing: SWING
        },

        play: function() {
            var anim = this,
                options = anim.options,
                element = anim.element,
                delay = options.delay || 0,
                start = +new Date() + delay,
                duration = options.duration,
                finish = start + duration,
                domElement = doc.getElementById(element.options.id),
                easing = jQuery.easing[options.easing],
                wallTime,
                time,
                pos,
                easingPos;

            setTimeout(function() {
                var loop = function() {
                    wallTime = +new Date();
                    time = math.min(wallTime - start, duration);
                    pos = time / duration;
                    easingPos = easing(pos, time, 0, 1, duration);

                    anim.step(easingPos);

                    element.refresh(domElement);

                    if (wallTime < finish) {
                        requestAnimFrame(loop, domElement);
                    }
                };

                loop();
            }, delay);
        },

        setup: function() {
        },

        step: function(pos) {
        }
    });

    var FadeAnimation = ElementAnimation.extend({
        options: {
            duration: 200,
            easing: LINEAR
        },

        setup: function() {
            var anim = this,
                options = anim.element.options;

            anim.targetFillOpacity = options.fillOpacity;
            anim.targetStrokeOpacity = options.strokeOpacity;
            options.fillOpacity = options.strokeOpacity = 0;
        },

        step: function(pos) {
            var anim = this,
                options = anim.element.options;

            options.fillOpacity = pos * anim.targetFillOpacity;
            options.strokeOpacity = pos * anim.targetStrokeOpacity;
        }
    });

    var ExpandAnimation = ElementAnimation.extend({
        options: {
            size: 0,
            easing: LINEAR
        },

        setup: function() {
            var anim = this,
                points = anim.element.points;

            points[1].x = points[2].x = points[0].x;
        },

        step: function(pos) {
            var anim = this,
                options = anim.options,
                size = interpolateValue(0, options.size, pos),
                points = anim.element.points;

            // Expands rectangle to the right
            points[1].x = points[2].x = points[0].x + size;
        }
    });

    var requestAnimFrame =
        window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(callback, element) {
            setTimeout(callback, ANIMATION_STEP);
        };

    var BarAnimation = ElementAnimation.extend({
        options: {
            easing: SWING
        },

        setup: function() {
            var anim = this,
                element = anim.element,
                points = element.points,
                options = element.options,
                axis = options.normalAngle === 0 ? Y : X,
                stackBase = options.stackBase,
                aboveAxis = options.aboveAxis,
                startPosition,
                endState = anim.endState = {
                    top: points[0].y,
                    right: points[1].x,
                    bottom: points[3].y,
                    left: points[0].x
                };

            if (axis === Y) {
                startPosition = defined(stackBase) ? stackBase :
                    aboveAxis ? endState.bottom : endState.top;
            } else {
                startPosition = defined(stackBase) ? stackBase :
                    aboveAxis ? endState.left : endState.right;
            }

            anim.startPosition = startPosition;

            updateArray(points, axis, startPosition);
        },

        step: function(pos) {
            var anim = this,
                startPosition = anim.startPosition,
                endState = anim.endState,
                element = anim.element,
                points = element.points;

            if (element.options.normalAngle === 0) {
                points[0].y = points[1].y =
                    interpolateValue(startPosition, endState.top, pos);

                points[2].y = points[3].y =
                    interpolateValue(startPosition, endState.bottom, pos);
            } else {
                points[0].x = points[3].x =
                    interpolateValue(startPosition, endState.left, pos);

                points[1].x = points[2].x =
                    interpolateValue(startPosition, endState.right, pos);
            }
        }
    });

    var PieAnimation = ElementAnimation.extend({
        options: {
            easing: "easeOutElastic",
            duration: INITIAL_ANIMATION_DURATION
        },

        setup: function() {
            var anim = this,
                sector = anim.element.circleSector;

            anim.endRadius = sector.r;
            sector.r = 0;
        },

        step: function(pos) {
            var anim = this,
                endRadius = anim.endRadius,
                sector = anim.element.circleSector;

            sector.r = interpolateValue(0, endRadius, pos);
        }
    });

    var Highlight = Class.extend({
        init: function(view, viewElement, options) {
            var highlight = this;
            highlight.options = deepExtend({}, highlight.options, options);

            highlight.view = view;
            highlight.viewElement = viewElement;
        },

        options: {
            fill: WHITE,
            fillOpacity: 0.2,
            stroke: WHITE,
            strokeWidth: 1,
            strokeOpacity: 0.2
        },

        show: function(point) {
            var highlight = this,
                view = highlight.view,
                viewElement = highlight.viewElement,
                outline,
                element;

            highlight.hide();

            if (point.getOutlineElement) {
                outline = point.getOutlineElement(view, highlight.options);

                if (outline) {
                    element = view.renderElement(outline);
                    viewElement.appendChild(element);

                    highlight.element = element;
                    highlight.visible = true;
                }
            }
        },

        hide: function() {
            var highlight = this,
                element = highlight.element;

            if (element) {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }

                delete highlight.element;
                highlight.visible = false;
            }
        }
    });

    var Tooltip = Class.extend({
        init: function(chartElement, options) {
            var tooltip = this;

            tooltip.options = deepExtend({}, tooltip.options, options);
            options = tooltip.options;

            tooltip.chartElement = chartElement;
            tooltip.chartPadding = {
                top: parseInt(chartElement.css("paddingTop"), 10),
                left: parseInt(chartElement.css("paddingLeft"), 10)
            };

            tooltip.template = Tooltip.template;
            if (!tooltip.template) {
                tooltip.template = Tooltip.template = template(
                    "<div style='display:none; position: absolute; font: #= d.font #;" +
                    "border-radius: 4px; -moz-border-radius: 4px; -webkit-border-radius: 4px;" +
                    "border: #= d.border.width #px solid;" +
                    "opacity: #= d.opacity #; filter: alpha(opacity=#= d.opacity * 100 #);" +
                    "padding: 2px 6px; white-space: nowrap; z-index: 1000;'></div>"
                );
            }

            tooltip.element = $(tooltip.template(tooltip.options)).appendTo(chartElement);
        },

        options: {
            background: BLACK,
            color: WHITE,
            border: {
                width: 3
            },
            opacity: 1,
            animation: {
                duration: TOOLTIP_ANIMATION_DURATION
            }
        },

        show: function(point) {
            var tooltip = this;

            tooltip.point = point;
            tooltip.showTimeout =
                setTimeout(proxy(tooltip._show, tooltip), TOOLTIP_SHOW_DELAY);
        },

        _show: function() {
            var tooltip = this,
                point = tooltip.point,
                element = tooltip.element,
                options = tooltip.options,
                chartPadding = tooltip.chartPadding,
                anchor,
                template,
                content,
                tooltipOptions,
                top,
                left;

            if (!point) {
                return;
            }
            content = point.value.toString();

            tooltipOptions = deepExtend({}, tooltip.options, point.options.tooltip);

            if (tooltipOptions.template) {
                template = baseTemplate(tooltipOptions.template);
                content = template({
                    value: point.value,
                    category: point.category,
                    series: point.series,
                    dataItem: point.dataItem,
                    percentage: point.percentage
                });
            } else if (tooltipOptions.format) {
                content = point.formatPointValue(tooltipOptions.format);
            }

            element.html(content);

            anchor = point.tooltipAnchor(element.outerWidth(), element.outerHeight());
            top = round(anchor.y + chartPadding.top) + "px";
            left = round(anchor.x + chartPadding.left) + "px";

            if (!tooltip.visible) {
                tooltip.element.css({ top: top, left: left });
            }

            tooltip.element
                .css({
                   backgroundColor: tooltipOptions.background,
                   borderColor: tooltipOptions.border.color || point.options.color,
                   color: tooltipOptions.color,
                   opacity: tooltipOptions.opacity,
                   borderWidth: tooltipOptions.border.width
                })
                .stop(true, true)
                .show()
                .animate({
                    left: left,
                    top: top
                }, options.animation.duration);

            tooltip.visible = true;
        },

        hide: function() {
            var tooltip = this;

            clearTimeout(tooltip.showTimeout);

            if (tooltip.visible) {
                tooltip.element.fadeOut();

                tooltip.point = null;
                tooltip.visible = false;
            }
        }
    });

    // Helper functions
    function ceil(value, step) {
        return round(math.ceil(value / step) * step, DEFAULT_PRECISION);
    }

    function floor(value, step) {
        return round(math.floor(value / step) * step, DEFAULT_PRECISION);
    }

    function round(value, precision) {
        var power = math.pow(10, precision || 0);
        return math.round(value * power) / power;
    }

    function measureText(text, style, rotation) {
        var styleHash = getHash(style),
            cacheKey = text + styleHash + rotation,
            cachedResult = measureText.cache[cacheKey];

        if (cachedResult) {
            return cachedResult;
        }

        var measureBox = measureText.measureBox,
            baselineMarker = measureText.baselineMarker.cloneNode(false);

        if (!measureBox) {
            measureBox = measureText.measureBox =
                $("<div style='position: absolute; top: -4000px; left: -4000px;" +
                              "line-height: normal; visibility: hidden;' />")
                .appendTo(doc.body)[0];
        }

        for (var styleKey in style) {
            measureBox.style[styleKey] = style[styleKey];
        }
        measureBox.innerHTML = text;
        measureBox.appendChild(baselineMarker);

        var size = {
                width: measureBox.offsetWidth - BASELINE_MARKER_SIZE,
                height: measureBox.offsetHeight,
                baseline: baselineMarker.offsetTop + BASELINE_MARKER_SIZE
            };

        if (rotation) {
            var width = size.width,
                height = size.height,
                cx = width / 2,
                cy = height / 2,
                r1 = rotatePoint(0, 0, cx, cy, rotation),
                r2 = rotatePoint(width, 0, cx, cy, rotation),
                r3 = rotatePoint(width, height, cx, cy, rotation);
                r4 = rotatePoint(0, height, cx, cy, rotation);

            size.normalWidth = width;
            size.normalHeight = height;
            size.width = math.max(r1.x, r2.x, r3.x, r4.x) - math.min(r1.x, r2.x, r3.x, r4.x);
            size.height = math.max(r1.y, r2.y, r3.y, r4.y) - math.min(r1.y, r2.y, r3.y, r4.y);
        }

        measureText.cache[cacheKey] = size;

        return size;
    }

    measureText.cache = {};
    measureText.baselineMarker =
        $("<div style='display: inline-block; vertical-align: baseline;" +
                  "width: " + BASELINE_MARKER_SIZE + "px; height: " + BASELINE_MARKER_SIZE + "px;" +
                  "zoom: 1; *display: inline; overflow: hidden;' />")[0];

    function getHash(object) {
        var hash = [];
        for (var key in object) {
            hash.push(key + object[key]);
        }

        return hash.sort().join(" ");
    }

    function rotatePoint(x, y, cx, cy, angle) {
        var theta = angle * DEGREE;
        return {
            x: cx + (x - cx) * math.cos(theta) + (y - cy) * math.sin(theta),
            y: cy - (x - cx) * math.sin(theta) + (y - cy) * math.cos(theta)
        }
    }

    function boxDiff(r, s) {
        if (r.x1 == s.x1 && r.y1 == s.y1 && r.x2 == s.x2 && r.y2 == s.y2) {
            return s;
        }

        var a = math.min(r.x1, s.x1),
            b = math.max(r.x1, s.x1),
            c = math.min(r.x2, s.x2),
            d = math.max(r.x2, s.x2),
            e = math.min(r.y1, s.y1),
            f = math.max(r.y1, s.y1),
            g = math.min(r.y2, s.y2),
            h = math.max(r.y2, s.y2),
            result = [];

        // X = intersection, 0-7 = possible difference areas
        // h +-+-+-+
        // . |5|6|7|
        // g +-+-+-+
        // . |3|X|4|
        // f +-+-+-+
        // . |0|1|2|
        // e +-+-+-+
        // . a b c d

        // we'll always have rectangles 1, 3, 4 and 6
        result[0] = new Box2D(b, e, c, f);
        result[1] = new Box2D(a, f, b, g);
        result[2] = new Box2D(c, f, d, g);
        result[3] = new Box2D(b, g, c, h);

        // decide which corners
        if( r.x1 == a && r.y1 == e || s.x1 == a && s.y1 == e )
        { // corners 0 and 7
            result[4] = new Box2D(a, e, b, f);
            result[5] = new Box2D(c, g, d, h);
        }
        else
        { // corners 2 and 5
            result[4] = new Box2D(c, e, d, f);
            result[5] = new Box2D(a, g, b, h);
        }

        return $.grep(result, function(box) {
            return box.height() > 0 && box.width() > 0
        })[0];
    }

    function sparseArrayMin(arr) {
        return sparseArrayLimits(arr).min;
    }

    function sparseArrayMax(arr) {
        return sparseArrayLimits(arr).max;
    }

    function sparseArrayLimits(arr) {
        var min = MAX_VALUE,
            max = MIN_VALUE,
            i,
            length = arr.length,
            n;

        for (i = 0; i < length; i++) {
            n = arr[i];
            if (defined(n)) {
                min = math.min(min, n);
                max = math.max(max, n);
            }
        }

        return { min: min, max: max };
    }

    function getSpacing(value) {
        var spacing = { top: 0, right: 0, bottom: 0, left: 0 };

        if (typeof(value) === "number") {
            spacing[TOP] = spacing[RIGHT] = spacing[BOTTOM] = spacing[LEFT] = value;
        } else {
            spacing[TOP] = value[TOP] || 0;
            spacing[RIGHT] = value[RIGHT] || 0;
            spacing[BOTTOM] = value[BOTTOM] || 0;
            spacing[LEFT] = value[LEFT] || 0;
        }

        return spacing;
    }

    function inArray(value, array) {
        return $.inArray(value, array) != -1;
    }

    function last(array) {
        return array[array.length - 1];
    }

    function deepExtend(destination) {
        var i = 1,
            length = arguments.length;

        for (i = 1; i < length; i++) {
            deepExtendOne(destination, arguments[i]);
        }

        return destination;
    }

    function deepExtendOne(destination, source) {
        var property,
            propValue,
            propType,
            destProp;

        for (property in source) {
            propValue = source[property];
            propType = typeof propValue;
            if (propType === OBJECT && propValue !== null && propValue.constructor !== Array) {
                destProp = destination[property];
                if (typeof (destProp) === OBJECT) {
                    destination[property] = destProp || {};
                } else {
                    destination[property] = {};
                }
                deepExtendOne(destination[property], propValue);
            } else if (propType !== UNDEFINED) {
                destination[property] = propValue;
            }
        }

        return destination;
    }

    function intersection(a1, a2, b1, b2) {
        var result,
            ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x),
            u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y),
            ua;

        if (u_b != 0) {
            ua = (ua_t / u_b);

            result = new Point2D(
                a1.x + ua * (a2.x - a1.x),
                a1.y + ua * (a2.y - a1.y)
            );
        }

        return result;
    }

    function append(first, second) {
        [].push.apply(first, second);
    }

    function interpolateValue(start, end, progress) {
        return round(start + (end - start) * progress, COORD_PRECISION);
    }

    function applySeriesDefaults(options, themeOptions) {
        var series = options.series,
            i,
            seriesLength = series.length,
            seriesType,
            seriesDefaults = options.seriesDefaults,
            commonDefaults = deepExtend({}, options.seriesDefaults),
            themeSeriesDefaults = themeOptions ? deepExtend({}, themeOptions.seriesDefaults) : {},
            commonThemeDefaults = deepExtend({}, themeSeriesDefaults);

        cleanupNestedSeriesDefaults(commonDefaults);
        cleanupNestedSeriesDefaults(commonThemeDefaults);

        for (i = 0; i < seriesLength; i++) {
            seriesType = series[i].type || options.seriesDefaults.type;

            series[i] = deepExtend(
                {},
                commonThemeDefaults,
                themeSeriesDefaults[seriesType],
                { tooltip: options.tooltip },
                commonDefaults,
                seriesDefaults[seriesType],
                series[i]);
        }
    }

    function cleanupNestedSeriesDefaults(seriesDefaults) {
        delete seriesDefaults.bar;
        delete seriesDefaults.column;
        delete seriesDefaults.line;
        delete seriesDefaults.verticalLine;
        delete seriesDefaults.pie;
        delete seriesDefaults.area;
        delete seriesDefaults.verticalArea;
        delete seriesDefaults.scatter;
        delete seriesDefaults.scatterLine;
    }

    function applySeriesColors(options) {
        var series = options.series,
            i,
            seriesLength = series.length,
            colors = options.seriesColors || [];

        for (i = 0; i < seriesLength; i++) {
            series[i].color = series[i].color || colors[i % colors.length];
        }
    }

    function applyAxisDefaults(options, themeOptions) {
        var themeAxisDefaults = deepExtend({}, (themeOptions || {}).axisDefaults);

        each(["category", "value", "x", "y"], function() {
            var axisName = this + "Axis",
                axes = [].concat(options[axisName]);

            axes = $.map(axes, function(axisOptions) {
                var axisColor = (axisOptions || {}).color;
                return deepExtend({},
                    themeAxisDefaults,
                    themeAxisDefaults[axisName],
                    options.axisDefaults,
                    { line: { color: axisColor }, labels: { color: axisColor }, title: { color: axisColor } },
                    axisOptions
                );
            });

            options[axisName] = axes.length > 1 ? axes : axes[0];
        });
    }

    function applyDefaults(options, themeOptions) {
        applyAxisDefaults(options, themeOptions);
        applySeriesDefaults(options, themeOptions);
    }

    function incrementSlot(slots, index, value) {
        slots[index] = (slots[index] || 0) + value;
    }

    function defined(value) {
        return typeof value !== UNDEFINED;
    }

    var uniqueId = (function() {
        // Implements 32-bit Linear feedback shift register
        var lfsr = 1;

        return function() {
            lfsr = ((lfsr >>> 1) ^ (-(lfsr & 1) & 0xD0000001)) >>> 0;
            return ID_PREFIX + lfsr.toString(16);
        };
    })();

    var Color = function(value) {
        var color = this,
            formats = Color.formats,
            re,
            processor,
            parts,
            i,
            channels;

        if (arguments.length === 1) {
            value = color.resolveColor(value);

            for (i = 0; i < formats.length; i++) {
                re = formats[i].re;
                processor = formats[i].process;
                parts = re.exec(value);

                if (parts) {
                    channels = processor(parts);
                    color.r = channels[0];
                    color.g = channels[1];
                    color.b = channels[2];
                }
            }
        } else {
            color.r = arguments[0];
            color.g = arguments[1];
            color.b = arguments[2];
        }

        color.r = color.normalizeByte(color.r);
        color.g = color.normalizeByte(color.g);
        color.b = color.normalizeByte(color.b);
    };

    Color.prototype = {
        toHex: function() {
            var color = this,
                pad = color.padDigit,
                r = color.r.toString(16),
                g = color.g.toString(16),
                b = color.b.toString(16);

            return "#" + pad(r) + pad(g) + pad(b);
        },

        resolveColor: function(value) {
            value = value || BLACK;

            if (value.charAt(0) == "#") {
                value = value.substr(1, 6);
            }

            value = value.replace(/ /g, "");
            value = value.toLowerCase();
            value = Color.namedColors[value] || value;

            return value;
        },

        normalizeByte: function(value) {
            return (value < 0 || isNaN(value)) ? 0 : ((value > 255) ? 255 : value);
        },

        padDigit: function(value) {
            return (value.length === 1) ? "0" + value : value;
        },

        brightness: function(value) {
            var color = this,
                round = math.round;

            color.r = round(color.normalizeByte(color.r * value));
            color.g = round(color.normalizeByte(color.g * value));
            color.b = round(color.normalizeByte(color.b * value));

            return color;
        }
    };

    Color.formats = [{
            re: /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
            process: function(parts) {
                return [
                    parseInt(parts[1], 10), parseInt(parts[2], 10), parseInt(parts[3], 10)
                ];
            }
        }, {
            re: /^(\w{2})(\w{2})(\w{2})$/,
            process: function(parts) {
                return [
                    parseInt(parts[1], 16), parseInt(parts[2], 16), parseInt(parts[3], 16)
                ];
            }
        }, {
            re: /^(\w{1})(\w{1})(\w{1})$/,
            process: function(parts) {
                return [
                    parseInt(parts[1] + parts[1], 16),
                    parseInt(parts[2] + parts[2], 16),
                    parseInt(parts[3] + parts[3], 16)
                ];
            }
        }
    ];

    Color.namedColors = {
        aqua: "00ffff", azure: "f0ffff", beige: "f5f5dc",
        black: "000000", blue: "0000ff", brown: "a52a2a",
        coral: "ff7f50", cyan: "00ffff", darkblue: "00008b",
        darkcyan: "008b8b", darkgray: "a9a9a9", darkgreen: "006400",
        darkorange: "ff8c00", darkred: "8b0000", dimgray: "696969",
        fuchsia: "ff00ff", gold: "ffd700", goldenrod: "daa520",
        gray: "808080", green: "008000", greenyellow: "adff2f",
        indigo: "4b0082", ivory: "fffff0", khaki: "f0e68c",
        lightblue: "add8e6", lightgrey: "d3d3d3", lightgreen: "90ee90",
        lightpink: "ffb6c1", lightyellow: "ffffe0", lime: "00ff00",
        limegreen: "32cd32", linen: "faf0e6", magenta: "ff00ff",
        maroon: "800000", mediumblue: "0000cd", navy: "000080",
        olive: "808000", orange: "ffa500", orangered: "ff4500",
        orchid: "da70d6", pink: "ffc0cb", plum: "dda0dd",
        purple: "800080", red: "ff0000", royalblue: "4169e1",
        salmon: "fa8072", silver: "c0c0c0", skyblue: "87ceeb",
        slateblue: "6a5acd", slategray: "708090", snow: "fffafa",
        steelblue: "4682b4", tan: "d2b48c", teal: "008080",
        tomato: "ff6347", turquoise: "40e0d0", violet: "ee82ee",
        wheat: "f5deb3", white: "ffffff", whitesmoke: "f5f5f5",
        yellow: "ffff00", yellowgreen: "9acd32"
    };

    Chart.Gradients = {
        glass: {
            type: LINEAR,
            rotation: 0,
            stops: [{
                offset: 0,
                color: WHITE,
                opacity: 0
            }, {
                offset: 0.1,
                color: WHITE,
                opacity: 0
            }, {
                offset: 0.25,
                color: WHITE,
                opacity: 0.3
            }, {
                offset: 0.92,
                color: WHITE,
                opacity: 0
            }, {
                offset: 1,
                color: WHITE,
                opacity: 0
            }]
        },
        sharpBevel: {
            type: RADIAL,
            stops: [{
                offset: 0,
                color: WHITE,
                opacity: 0.55
            }, {
                offset: 0.65,
                color: WHITE,
                opacity: 0
            }, {
                offset: 0.95,
                color: WHITE,
                opacity: 0
            }, {
                offset: 0.95,
                color: WHITE,
                opacity: 0.25
            }]
        },
        roundedBevel: {
            type: RADIAL,
            stops: [{
                offset: 0.33,
                color: WHITE,
                opacity: 0.06
            }, {
                offset: 0.83,
                color: WHITE,
                opacity: 0.2
            }, {
                offset: 0.95,
                color: WHITE,
                opacity: 0
            }]
        }
    };

    function updateArray(arr, prop, value) {
        var i,
            length = arr.length;

        for(i = 0; i < length; i++) {
            arr[i][prop] = value;
        }
    }

    function categoriesCount(series) {
        var seriesCount = series.length,
            categories = 0,
            i;

        for (i = 0; i < seriesCount; i++) {
            categories = math.max(categories, series[i].data.length);
        }

        return categories;
    }

    function sqr(value) {
        return value * value;
    }

    jQuery.extend(jQuery.easing, {
        easeOutElastic: function (n, d, first, diff) {
            var s = 1.70158,
                p = 0,
                a = diff;

            if ( n === 0 ) {
                return first;
            }

            if ( n === 1) {
                return first + diff;
            }

            if (!p) {
                p = 0.5;
            }

            if (a < math.abs(diff)) {
                a=diff;
                s = p / 4;
            } else {
                s = p / (2 * math.PI) * math.asin(diff / a);
            }

            return a * math.pow(2,-10 * n) *
                   math.sin((n * 1 - s) * (1.1 * math.PI) / p) +
                   diff + first;
        }
    });

    function getField(field, row) {
        if (row === null) {
            return null;
        }

        var get = getField.cache[field] =
                getField.cache[field] || getter(field, true);

        return get(row);
    }
    getField.cache = {};

    // Exports ================================================================

    $t.scripts.push("telerik.chart.js");

    $t.chart = function (element, options) {
        var wrapper = this,
            chart,
            dataSource,
            e = {};
        
        wrapper.element = element;

        $t.bind(wrapper.element, {
            load: options.onLoad,
            error: options.onError,
            dataBinding: options.onDataBinding
        });

        deepExtend(options, {
            dataBound: options.onDataBound,
            seriesClick: options.onSeriesClick
        });
        
        wrapper._chart = chart = new Chart(element, extend({ autoBind: false }, options));

        dataSource = chart.dataSource;
        if (dataSource) {
            dataSource.bind("error", function(xhr, status, response) {
                var prevented = trigger(element, "error", {
                    XMLHttpRequest: xhr
                });

                if (!prevented) {
                    alert("Error! Data binding failed. Unexpected server response - see console.");
                }
            });

            $(wrapper.element).bind("load", function() {
                if (!trigger(element, DATA_BINDING, e)) {
                    chart.dataSource.query(e.data || {});
                }
            });
        }

        wrapper.options = chart.options;
    };

    $t.chart.prototype = {
        rebind: function(data) {
            this._ajaxRequest(data);
        },

        refresh: function() {
            var wrapper = this,
                chart = wrapper._chart;

            chart.options = wrapper.options;

            applyDefaults(chart.options);

            chart._redraw();
        },
        
        _ajaxRequest: function(data) {
            var e = {};

            if (!trigger(this.element, DATA_BINDING, e)) {
                this._chart.dataSource.read(extend(e.data || {}, data));
            }
        },

        refresh: function() {
            var wrapper = this,
                chart = wrapper._chart;

            chart.options = wrapper.options;
            chart.refresh();
        },

        svg: function() {
            return this._chart.svg();
        }
    };

    $.fn.tChart = function(options) {
        return $t.create(this, {
            name: "tChart",
            init: function(element, options) {
                return new $t.chart(element, options);
            },
            options: options
        });
    };

    $.fn.tChart.defaults = { };

    $t.chart.Chart = Chart;

    deepExtend(Chart, {
        COORD_PRECISION: COORD_PRECISION,
        CLIP: CLIP,
        DEFAULT_WIDTH: DEFAULT_WIDTH,
        DEFAULT_HEIGHT: DEFAULT_HEIGHT,
        DEFAULT_FONT: DEFAULT_FONT,
        defined: defined,
        template: template,
        rotatePoint: rotatePoint,
        round: round,
        supportsSVG: supportsSVG,
        uniqueId: uniqueId,
        Box2D: Box2D,
        Point2D: Point2D,
        Sector: Sector,
        Text: Text,
        BarLabel: BarLabel,
        ChartElement: ChartElement,
        RootElement: RootElement,
        BoxElement: BoxElement,
        TextBox: TextBox,
        NumericAxis: NumericAxis,
        CategoryAxis: CategoryAxis,
        Bar: Bar,
        BarChart: BarChart,
        ShapeElement: ShapeElement,
        LinePoint: LinePoint,
        LineChart: LineChart,
        AreaChart: AreaChart,
        ClusterLayout: ClusterLayout,
        StackLayout: StackLayout,
        Title: Title,
        Legend: Legend,
        CategoricalPlotArea: CategoricalPlotArea,
        PiePlotArea: PiePlotArea,
        XYPlotArea: XYPlotArea,
        Tooltip: Tooltip,
        Highlight: Highlight,
        PieSegment: PieSegment,
        PieChart: PieChart,
        ViewElement: ViewElement,
        ScatterChart: ScatterChart,
        ScatterLineChart: ScatterLineChart,
        ViewBase: ViewBase,
        deepExtend: deepExtend,
        Color: Color,
        measureText: measureText,
        ExpandAnimation: ExpandAnimation,
        BarAnimation: BarAnimation,
        BarAnimationDecorator: BarAnimationDecorator,
        PieAnimation: PieAnimation,
        PieAnimationDecorator: PieAnimationDecorator,
        FadeAnimation: FadeAnimation,
        FadeAnimationDecorator: FadeAnimationDecorator,
        categoriesCount: categoriesCount
    });

})(jQuery);