/*
 * Copyright 2020 WICKLETS LLC
 *
 * This file is part of Wick Engine.
 *
 * Wick Engine is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Wick Engine is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Wick Engine.  If not, see <https://www.gnu.org/licenses/>.
 */

class SelectionWidget {
    /**
     * Creates a SelectionWidget
     */
    constructor (args) {
        if(!args) args = {};
        if(!args.layer) args.layer = paper.project.activeLayer;

        this._layer = args.layer;
        this._item = new paper.Group({ insert:false });
        
        /*let startPath = new paper.Path.Circle({
            center: [0, 0],
            radius: 5,
            fillColor: 'lightblue',
            applyMatrix: false,
            data: {
                handleType: 'gradient-point',
                handleEdge: 'start'
            }
        });*/
        let startPath = new paper.Raster({
            source: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%2Fid%2FOIP.023w1FsrkWF2BeW2NBic4gHaHa%3Fpid%3DApi&f=1&ipt=28614e2186d3d599e1a1890764d84fb6cd48e5f661cc593052c14913393dcd3e&ipo=images',
            insert: false,
            applyMatrix: false,
            data: {
                handleType: 'gradient-point',
                handleEdge: 'start'
            }
            
        });
        startPath.onLoad = () => {startPath.size = [40, 40]}
        let endPath = new paper.Path.Circle({
            center: [0, 0],
            radius: 5,
            fillColor: 'lightblue',
            insert: false,
            applyMatrix: false,
            data: {
                handleType: 'gradient-point',
                handleEdge: 'end'
            }
        });
        let linePath = new paper.Path.Line({
            from: [0, 0],
            to: [0, 0],
            insert: false,
            strokeColor: 'lightblue',
            strokeWidth: 3,
            applyMatrix: false
        });
        // Don't include the hover stop in cursor hit tests
        let hoverStop = this._buildGradientStop();
        hoverStop.data.isBorder = true;

        this._gradientGUI = {
            container: new paper.Group({
                applyMatrix: false,
                data: { isSelectionBoxGUI: true }
            }),
            startPath, endPath, linePath,
            stops: [],
            selectedStop: null,
            hoverStop,
            createdStopOnDown: false,

            stroke: false,
            radial: false,
            
            startpoint: new paper.Point(0,0),
            endpoint: new paper.Point(0,0),
            lineVector: new paper.Point(0,0)
        };
    }

    /**
     * The item containing the widget GUI
     */
    get item () {
        return this._item;
    }

    /**
     * The layer to add the widget GUI item to.
     */
    get layer () {
        return this._layer;
    }

    set layer (layer) {
        this._layer = layer;
    }

    /**
     * The rotation of the selection box GUI.
     */
    get boxRotation () {
        return this._boxRotation;
    }

    set boxRotation (boxRotation) {
        this._boxRotation = boxRotation;
    }

    /**
     * The items currently inside the selection widget
     */
    get itemsInSelection () {
        return this._itemsInSelection;
    }

    /**
     * The point to rotate/scale the widget around.
     */
    get pivot () {
        return this._pivot;
    }

    set pivot (pivot) {
        this._pivot = pivot;
    }

    /**
     * The position of the top left corner of the selection box.
     */
    get position () {
        return this._boundingBox.topLeft.rotate(this.rotation, this.pivot);
    }

    set position (position) {
        var d = position.subtract(this.position);
        this.translateSelection(d);
    }

    /**
     * The width of the selection.
     */
    get width () {
        return this._boundingBox.width;
    }

    set width (width) {
        var d = width / this.width;
        if(d === 0) d = 0.001;
        this.scaleSelection(new paper.Point(d, 1.0));
    }

    /**
     * The height of the selection.
     */
    get height () {
        return this._boundingBox.height;
    }

    set height (height) {
        var d = height / this.height;
        this.scaleSelection(new paper.Point(1.0, d));
    }

    /**
     * The rotation of the selection.
     */
    get rotation () {
        return this._boxRotation;
    }

    set rotation (rotation) {
        var d = rotation - this.rotation;
        this.rotateSelection(d);
    }

    /**
     * Flip the selected items horizontally.
     */
    flipHorizontally () {
        this.scaleSelection(new paper.Point(-1.0, 1.0));
    }

    /**
     * Flip the selected items vertically.
     */
    flipVertically () {
        this.scaleSelection(new paper.Point(1.0, -1.0));
    }

    /**
     * The bounding box of the widget.
     */
    get boundingBox () {
        return this._boundingBox
    }

    /**
     * The current transformation being done to the selection widget.
     * @type {string}
     */
    get currentTransformation () {
        return this._currentTransformation;
    }

    set currentTransformation (currentTransformation) {
        if(['translate', 'scale', 'rotate', 'gradient-stop', 'gradient-point', 'gradient-none'].indexOf(currentTransformation) === -1) {
            console.error('Paper.SelectionWidget: Invalid transformation type: ' + currentTransformation);
            currentTransformation = null;
        } else {
            this._currentTransformation = currentTransformation;
        }
    }

    /**
     * Build a new SelectionWidget GUI around some items.
     * @param {number} boxRotation - the rotation of the selection GUI. Optional, defaults to 0
     * @param {paper.Item[]} items - the items to build the GUI around
     * @param {paper.Point} pivot - the pivot point that the selection rotates around. Defaults to (0,0)
     * @param {string|boolean} useGradientGUI - whether to use a gradient editing GUI. Defaults to false
     */
    build (args) {
        if(!args) args = {};
        if(!args.boxRotation) args.boxRotation = 0;
        if(!args.items) args.items = [];
        if(!args.pivot) args.pivot = new paper.Point();

        this._itemsInSelection = args.items;
        this._boxRotation = args.boxRotation;
        this._pivot = args.pivot;
        this._useGradientGUI = args.useGradientGUI;

        this._boundingBox = this._calculateBoundingBox();

        this.item.remove();
        this.item.removeChildren();

        if(this._ghost) {
            this._ghost.remove();
        }
        if(this._pivotPointHandle) {
            this._pivotPointHandle.remove();
        }

        if(this._itemsInSelection.length > 0) {
            this._center = this._calculateBoundingBoxOfItems(this._itemsInSelection).center;
            if(args.useGradientGUI) {
                this._buildGradientGUI(args.selectedStopIndex);
            } else {
                this._buildGUI();
            }
            this.layer.addChild(this.item);
        }
    }

    /**
     *
     */
    startTransformation (item, e) {
        if(this._useGradientGUI) {
            return this.startGradientTransformation(item, e);
        }

        this._ghost = this._buildGhost();
        this._layer.addChild(this._ghost);

        if(item.data.handleType === 'rotation') {
            this.currentTransformation = 'rotate';
        } else if (item.data.handleType === 'scale') {
            this.currentTransformation = 'scale';
        } else {
            this.currentTransformation = 'translate';
        }

        this._ghost.data.initialPosition = this._ghost.position;
        this._ghost.data.scale = new paper.Point(1,1);
    }

    /**
     *
     */
    updateTransformation (item, e) {
        if(this.currentTransformation.substring(0,8) === 'gradient') {
            return this.updateGradientTransformation(item, e);
        }

        if(this.currentTransformation === 'translate') {
            this._ghost.position = this._ghost.position.add(e.delta);
        } else if(this.currentTransformation === 'scale') {
            var lastPoint = e.point.subtract(e.delta);
            var currentPoint = e.point;
            lastPoint = lastPoint.rotate(-this.boxRotation, this.pivot);
            currentPoint = currentPoint.rotate(-this.boxRotation, this.pivot);
            var pivotToLastPointVector = lastPoint.subtract(this.pivot);
            var pivotToCurrentPointVector = currentPoint.subtract(this.pivot);
            var scaleAmt = pivotToCurrentPointVector.divide(pivotToLastPointVector);

            // Lock scaling in a direction if the side handles are being dragged.
            if(item.data.handleEdge === 'topCenter' || item.data.handleEdge === 'bottomCenter') {
                scaleAmt.x = 1.0;
            }
            if(item.data.handleEdge === 'leftCenter' || item.data.handleEdge === 'rightCenter') {
                scaleAmt.y = 1.0;
            }

            // Holding shift locks aspect ratio
            if(e.modifiers.shift) {
                scaleAmt.y = scaleAmt.x;
            }

            this._ghost.data.scale = this._ghost.data.scale.multiply(scaleAmt);

            this._ghost.matrix = new paper.Matrix();
            this._ghost.rotate(-this.boxRotation);
            this._ghost.scale(this._ghost.data.scale.x, this._ghost.data.scale.y, this.pivot);
            this._ghost.rotate(this.boxRotation);
        } else if (this.currentTransformation === 'rotate') {
            var lastPoint = e.point.subtract(e.delta);
            var currentPoint = e.point;
            var pivotToLastPointVector = lastPoint.subtract(this.pivot);
            var pivotToCurrentPointVector = currentPoint.subtract(this.pivot);
            var pivotToLastPointAngle = pivotToLastPointVector.angle;
            var pivotToCurrentPointAngle = pivotToCurrentPointVector.angle;
            var rotation = pivotToCurrentPointAngle - pivotToLastPointAngle;
            this._ghost.rotate(rotation, this.pivot);
            this.boxRotation += rotation;
        }
    }

    /**
     *
     */
    finishTransformation (item) {
        if(!this._currentTransformation) return;
        if(this.currentTransformation.substring(0,8) === 'gradient') {
            return this.finishGradientTransformation();
        }

        this._ghost.remove();

        if(this.currentTransformation === 'translate') {
            var d = this._ghost.position.subtract(this._ghost.data.initialPosition);
            this.translateSelection(d);
        } else if(this.currentTransformation === 'scale') {
            this.scaleSelection(this._ghost.data.scale);
        } else if(this.currentTransformation === 'rotate') {
            this.rotateSelection(this._ghost.rotation);
        }

        this._currentTransformation = null;
    }

    /**
     *
     */
    translateSelection (delta) {
        this._itemsInSelection.forEach(item => {
            item.position = item.position.add(delta);
        });
        this.pivot = this.pivot.add(delta);
    }

    /**
     *
     */
    scaleSelection (scale) {
        this._itemsInSelection.forEach(item => {
            item.rotate(-this.boxRotation, this.pivot);
            item.scale(scale, this.pivot);
            item.rotate(this.boxRotation, this.pivot);
        });
    }

    /**
     *
     */
    rotateSelection (angle) {
        this._itemsInSelection.forEach(item => {
            item.rotate(angle, this.pivot);
        });
    }

    _buildGUI () {
        this.item.addChild(this._buildBorder());

        if(this._itemsInSelection.length > 1) {
            this.item.addChildren(this._buildItemOutlines());
        }

        let guiElements = [];

        guiElements.push(this._buildRotationHotspot('topLeft'));
        guiElements.push(this._buildRotationHotspot('topRight'));
        guiElements.push(this._buildRotationHotspot('bottomLeft'));
        guiElements.push(this._buildRotationHotspot('bottomRight'));

        guiElements.push(this._buildScalingHandle('topLeft'));
        guiElements.push(this._buildScalingHandle('topRight'));
        guiElements.push(this._buildScalingHandle('bottomLeft'));
        guiElements.push(this._buildScalingHandle('bottomRight'));
        guiElements.push(this._buildScalingHandle('topCenter'));
        guiElements.push(this._buildScalingHandle('bottomCenter'));
        guiElements.push(this._buildScalingHandle('leftCenter'));
        guiElements.push(this._buildScalingHandle('rightCenter'));

        this.item.addChildren(guiElements);

        this._pivotPointHandle = this._buildPivotPointHandle();
        this.layer.addChild(this._pivotPointHandle);

        this.item.rotate(this.boxRotation, this._center);

        this.item.children.forEach(child => {
            child.data.isSelectionBoxGUI = true;
        });
    }

    _buildBorder () {
        var border = new paper.Path.Rectangle({
            name: 'border',
            from: this.boundingBox.topLeft,
            to: this.boundingBox.bottomRight,
            strokeWidth: SelectionWidget.BOX_STROKE_WIDTH,
            strokeColor: SelectionWidget.BOX_STROKE_COLOR,
            insert: false,
        });
        border.data.isBorder = true;
        return border;
    }

    _buildItemOutlines () {
        return this._itemsInSelection.map(item => {
            var clone = item.clone({insert:false});
            clone.rotate(-this.boxRotation, this._center);
            var bounds = clone.bounds;
            var border = new paper.Path.Rectangle({
                from: bounds.topLeft,
                to: bounds.bottomRight,
                strokeWidth: SelectionWidget.BOX_STROKE_WIDTH,
                strokeColor: SelectionWidget.BOX_STROKE_COLOR,
            });
            //border.rotate(-this.boxRotation, this._center);
            border.remove();
            return border;
        });
    }

    _buildScalingHandle (edge) {
        var handle = this._buildHandle({
            name: edge,
            type: 'scale',
            center: this.boundingBox[edge],
            fillColor: SelectionWidget.HANDLE_FILL_COLOR,
            strokeColor: SelectionWidget.HANDLE_STROKE_COLOR,
        });
        return handle;
    }

    _buildPivotPointHandle () {
        var handle = this._buildHandle({
            name: 'pivot',
            type: 'pivot',
            center: this.pivot,
            fillColor: SelectionWidget.PIVOT_FILL_COLOR,
            strokeColor: SelectionWidget.PIVOT_STROKE_COLOR,
        });
        handle.locked = true;
        return handle;
    }

    _buildHandle (args) {
        if(!args) console.error('_createHandle: args is required');
        if(!args.name) console.error('_createHandle: args.name is required');
        if(!args.type) console.error('_createHandle: args.type is required');
        if(!args.center) console.error('_createHandle: args.center is required');
        if(!args.fillColor) console.error('_createHandle: args.fillColor is required');
        if(!args.strokeColor) console.error('_createHandle: args.strokeColor is required');

        var circle = new paper.Path.Circle({
            center: args.center,
            radius: SelectionWidget.HANDLE_RADIUS / paper.view.zoom,
            strokeWidth: SelectionWidget.HANDLE_STROKE_WIDTH / paper.view.zoom,
            strokeColor: args.strokeColor,
            fillColor: args.fillColor,
            insert: false,
        });
        circle.applyMatrix = false;
        circle.data.isSelectionBoxGUI = true;
        circle.data.handleType = args.type;
        circle.data.handleEdge = args.name;
        return circle;
    }

    _buildRotationHotspot (cornerName) {
        // Build the not-yet-rotated hotspot, which starts out like this:

        //       |
        //       +---+
        //       |   |
        // ---+--+   |---
        //    |      |
        //    +------+
        //       |

        var r = SelectionWidget.ROTATION_HOTSPOT_RADIUS / paper.view.zoom;
        var hotspot = new paper.Path([
            new paper.Point(0,0),
            new paper.Point(0, r),
            new paper.Point(r, r),
            new paper.Point(r, -r),
            new paper.Point(-r, -r),
            new paper.Point(-r, 0),
        ]);
        hotspot.fillColor = SelectionWidget.ROTATION_HOTSPOT_FILLCOLOR;
        hotspot.position.x = this.boundingBox[cornerName].x;
        hotspot.position.y = this.boundingBox[cornerName].y;

        // Orient the rotation handles in the correct direction, even if the selection is flipped
        hotspot.rotate({
            'topRight': 0,
            'bottomRight': 90,
            'bottomLeft': 180,
            'topLeft': 270,
        }[cornerName]);

        // Some metadata.
        hotspot.data.handleType = 'rotation';
        hotspot.data.handleEdge = cornerName;

        return hotspot;
    }

    _buildGhost () {
        var ghost = new paper.Group({
            insert: false,
            applyMatrix: false,
        });

        this._itemsInSelection.forEach(item => {
            var outline = item.clone();
            outline.remove();
            outline.fillColor = 'rgba(0,0,0,0)';
            outline.strokeColor = SelectionWidget.GHOST_STROKE_COLOR;
            outline.strokeWidth = SelectionWidget.GHOST_STROKE_WIDTH * 2;
            ghost.addChild(outline);

            var outline2 = outline.clone();
            outline2.remove();
            outline2.fillColor = 'rgba(0,0,0,0)';
            outline2.strokeColor = '#ffffff';
            outline2.strokeWidth = SelectionWidget.GHOST_STROKE_WIDTH;
            ghost.addChild(outline2);
        });

        var boundsOutline = new paper.Path.Rectangle({
            from: this.boundingBox.topLeft,
            to: this.boundingBox.bottomRight,
            fillColor: 'rgba(0,0,0,0)',
            strokeColor: SelectionWidget.GHOST_STROKE_COLOR,
            strokeWidth: SelectionWidget.GHOST_STROKE_WIDTH,
            applyMatrix: false,
        });
        boundsOutline.rotate(this.boxRotation, this._center);
        ghost.addChild(boundsOutline);

        ghost.opacity = 0.5;

        return ghost;
    }

    _calculateBoundingBox () {
        if(this._itemsInSelection.length === 0) {
            return new paper.Rectangle();
        }

        var center = this._calculateBoundingBoxOfItems(this._itemsInSelection).center;

        var itemsForBoundsCalc = this._itemsInSelection.map(item => {
            var clone = item.clone();
            clone.rotate(-this.boxRotation, center);
            clone.remove();
            return clone;
        });

        return this._calculateBoundingBoxOfItems(itemsForBoundsCalc);
    }

    _calculateBoundingBoxOfItems (items) {
        var bounds = null;
        items.forEach(item => {
            bounds = bounds ? bounds.unite(item.bounds) : item.bounds;
        });
        return bounds || new paper.Rectangle();
    }

    _buildGradientGUI (selectedStopIndex) {
        // this better not be a group
        let item = this._itemsInSelection[0];
        let color, stops, startpoint, endpoint;
        if(this._useGradientGUI === 'stroke') {
            color = item.strokeColor;
            this._gradientGUI.stroke = true;
        } else {
            color = item.fillColor;
            this._gradientGUI.stroke = false;
        }
        if(color.gradient) {
            this._gradientGUI.radial = color.gradient.radial;
            stops = color.gradient.stops;
            startpoint = color.origin;
            endpoint = color.destination;
        } else {
            // This is a solid color.
            this._gradientGUI.radial = false;
            stops = [{ color: color.clone(), offset: 0 }, { color: color.clone(), offset: 1 }];
            startpoint = item.bounds.topCenter;
            endpoint = item.bounds.bottomCenter;
        }
        let lineVector = endpoint.subtract(startpoint);
        this._gradientGUI.startpoint = startpoint;
        this._gradientGUI.endpoint = endpoint;
        this._gradientGUI.lineVector = lineVector;

        let container = this._gradientGUI.container;
        container.removeChildren();
        this._transformContainer();

        container.addChildren(this._buildGradientLine(lineVector.length));
        container.addChildren(this._buildGradientStops(lineVector.length, stops));
        container.addChild(this._buildHoverStop());
        this._selectStop(this._gradientGUI.stops[selectedStopIndex]);

        this.item.addChild(container);
        container.children.forEach(child => {
            child.data.isSelectionBoxGUI = true;
        });
    }

    /**
     * Update the gradient line GUI.
     * @param {paper.Color} color The paper.js gradient color object.
     * @returns {paper.Path[]} The start point, end point, and connecting line paths.
     */
    _buildGradientLine (length) {
        this._gradientGUI.endPath.position.x = length;
        this._gradientGUI.linePath.segments[1].point.x = length;
        return [this._gradientGUI.linePath, this._gradientGUI.startPath, this._gradientGUI.endPath];
    }

    /**
     * Update the gradient stops GUI.
     * @param {paper.Color} color The paper.js gradient color object.
     * @returns {paper.Path[]} The list of color stop paths.
     */
    _buildGradientStops (length, paperStops) {
        let stopList = this._gradientGUI.stops;

        paperStops.forEach((paperStop, idx) => {
            if(idx >= stopList.length) {
                stopList.push(this._buildGradientStop());
            }
            let stop = stopList[idx];
            stop.data.setColor(paperStop.color);
            stop.data.setOffset(length, paperStop.offset);
        });
        stopList.length = paperStops.length;
        return stopList;
    }

    _buildGradientStop (length=0, color, offset=0) {
        let stopObj = new paper.Path.Circle({
            center: [length * offset, 0],
            radius: 15,
            fillColor: color,
            strokeColor: 'green',
            strokeWidth: 0,
            applyMatrix: false,
            data: {
                handleType: 'gradient-stop',
                color, offset,
                selected: false
            }
        });
        stopObj.data.setColor = (color) => {
            stopObj.fillColor = color;
            stopObj.data.color = color;
        }
        stopObj.data.setOffset = (length, offset) => {
            stopObj.position.x = length * offset;
            stopObj.data.offset = offset;
        }
        stopObj.data.setSelected = (selected) => {
            stopObj.strokeWidth = selected ? 3 : 0;
            stopObj.data.selected = selected;
        }
        return stopObj;
    }

    _buildHoverStop (point) {
        this._gradientGUI.hoverStop.visible = false;
        if(point) {
            let offset = this._calculateValidOffset(this._gradientGUI.startpoint, this._gradientGUI.endpoint, point);
            if(offset !== null) {
                this._interpolateStop(this._gradientGUI.hoverStop, this._gradientGUI.lineVector.length, offset);
                this._gradientGUI.hoverStop.visible = true;
            }
        }
        return this._gradientGUI.hoverStop;
    }

    updateMove (item, e) {
        if(this._useGradientGUI && this._gradientGUI.container.visible) {
            if(item && !item.data.handleType) {
                this._buildHoverStop(e.point);
            } else {
                this._gradientGUI.hoverStop.visible = false;
            }
        }
    }
    updateDown (item, e, onStopSelected) {
        this._gradientGUI.createdStopOnDown = false;
        if(this._useGradientGUI && this._gradientGUI.container.visible) {
            if(item.data.handleType === 'gradient-stop') {
                this._selectStop(item);
                onStopSelected(this._gradientGUI.stops.indexOf(item));
            } else if(!item.data.handleType) {
                let offset = this._calculateValidOffset(this._gradientGUI.startpoint, this._gradientGUI.endpoint, e.point);
                if(offset !== null) {
                    // Create and select a new color stop
                    let newStop = this._buildGradientStop();
                    this._interpolateStop(newStop, this._gradientGUI.lineVector.length, offset);

                    this._gradientGUI.stops.push(newStop);
                    this._gradientGUI.container.addChild(newStop);
                    this._selectStop(newStop);

                    this._updateItems();
                    onStopSelected(this._gradientGUI.stops.length - 1);

                    this._gradientGUI.createdStopOnDown = true;
                }
            }
        }
    }

    startGradientTransformation (item, e) {
        this._gradientGUI.hoverStop.remove();
        if(item && item.data.handleType === 'gradient-stop') {
            this.currentTransformation = 'gradient-stop';
        } else if(item && item.data.handleType === 'gradient-point') {
            this.currentTransformation = 'gradient-point';
        } else if(this._gradientGUI.createdStopOnDown) {
            // Move the new color stop
            this.currentTransformation = 'gradient-stop';
            this._gradientGUI.createdStopOnDown = false;
        } else {
            // We have to set a currentTransformation for Cursor.js
            this.currentTransformation = 'gradient-none';
        }
    }

    updateGradientTransformation (item, e) {
        if(this.currentTransformation === 'gradient-stop') {
            let offset = this._calculateOffset(this._gradientGUI.startpoint, this._gradientGUI.endpoint, e.point);
            if(offset < 0) offset = 0;
            if(offset > 1) offset = 1;
            this._gradientGUI.selectedStop.data.setOffset(this._gradientGUI.lineVector.length, offset);
        } else if(this.currentTransformation === 'gradient-point') {
            if(item.data.handleEdge === 'start') {
                this._gradientGUI.startpoint = e.point;
            } else {
                this._gradientGUI.endpoint = e.point;
            }
            this._gradientGUI.lineVector = this._gradientGUI.endpoint.subtract(this._gradientGUI.startpoint);
            let length = this._gradientGUI.lineVector.length;
            this._transformContainer();
            this._buildGradientLine(length);
            this._gradientGUI.stops.forEach((stopObj) => {
                stopObj.data.setOffset(length, stopObj.data.offset);
            });
        }

        if(this.currentTransformation !== 'gradient-none') this._updateItems();
    }
    
    finishGradientTransformation (item, e) {
        if(!this._currentTransformation) return;

        if(this.currentTransformation !== 'gradient-none') this._updateItems();

        this._currentTransformation = null;
    }

    _updateItems () {
        let colorObj = {
            origin: this._gradientGUI.startpoint,
            destination: this._gradientGUI.endpoint,
            stops: this._gradientGUI.stops.map((stopPath) => {
                return { color: stopPath.data.color, offset: stopPath.data.offset }
            }),
            radial: this._gradientGUI.radial
        };

        // there better not be any groups
        if(this._gradientGUI.stroke) {
            this._itemsInSelection.forEach((item) => {
                item.strokeColor = colorObj;
            });
        } else {
            this._itemsInSelection.forEach((item) => {
                item.fillColor = colorObj;
            });
        }
    }

    _selectStop (stopObj) {
        if(this._gradientGUI.selectedStop) {
            this._gradientGUI.selectedStop.data.setSelected(false);
        }
        this._gradientGUI.selectedStop = stopObj;
        stopObj.data.setSelected(true);
    }

    _interpolateStop (stop, length, offset) {
        // Assuming unsorted stops list, find the stops right before and after given offset
        let stops = this._gradientGUI.stops;
        let stop1, stop2;
        let index1 = 0; let index2 = 1;
        stops.forEach(stop => {
            let stopOffset = stop.data.offset;
            if (index1 <= stopOffset && stopOffset <= offset) {
                stop1 = stop;
                index1 = stopOffset;
            }
            else if (offset <= stopOffset && stopOffset <= index2) {
                stop2 = stop;
                index2 = stopOffset;
            }
        });

        let color;
        if(!stop1) {
            // Offset is the leftmost stop, use the color of nextStop
            color = stop2.data.color.clone();
        } else if(!stop2) {
            // Offset is the rightmost stop, use the color of prevStop
            color = stop1.data.color.clone();
        } else {
            // Both stops exist, interpolate the color
            let offsetRelative = (offset - index1) / (index2 - index1);
            let color1 = stop1.data.color;
            let color2 = stop2.data.color;
            color = color1.add(color2.subtract(color1).multiply(offsetRelative));
            color.alpha = color1.alpha + (color2.alpha - color1.alpha) * offsetRelative;
        }

        stop.data.setColor(color);
        stop.data.setOffset(length, offset);
    }

    _transformContainer () {
        let container = this._gradientGUI.container;
        container.matrix.reset();
        container.translate(this._gradientGUI.startpoint);
        container.rotate(this._gradientGUI.lineVector.angle, this._gradientGUI.startpoint);
    }

    _calculateDistanceFromLine (startLine, endLine, point) {
        let pointVector = point.subtract(startLine);
        return Math.abs(pointVector.cross(endLine.subtract(startLine).normalize()));
    }

    _calculateOffset (startLine, endLine, point) {
        let relativePoint = point.subtract(startLine);
        let lineVector = endLine.subtract(startLine);
        let length = lineVector.length;
        return relativePoint.dot(lineVector) / (length * length);
    }
    _calculateValidOffset (startLine, endLine, point) {
        let distance = this._calculateDistanceFromLine(startLine, endLine, point);
        if (distance > 15) { // TODO: Replace with mouse distance constant
            return null;
        }
        let offset = this._calculateOffset(startLine, endLine, point);
        return (0 <= offset && offset <= 1) ? offset : null;
    }
};

SelectionWidget.BOX_STROKE_WIDTH = 1;
SelectionWidget.BOX_STROKE_COLOR = 'rgba(100,150,255,1.0)';
SelectionWidget.HANDLE_RADIUS = 5;
SelectionWidget.HANDLE_STROKE_WIDTH = SelectionWidget.BOX_STROKE_WIDTH
SelectionWidget.HANDLE_STROKE_COLOR = SelectionWidget.BOX_STROKE_COLOR
SelectionWidget.HANDLE_FILL_COLOR = 'rgba(255,255,255,0.3)';
SelectionWidget.PIVOT_STROKE_WIDTH = SelectionWidget.BOX_STROKE_WIDTH;
SelectionWidget.PIVOT_FILL_COLOR = 'rgba(255,255,255,0.5)';
SelectionWidget.PIVOT_STROKE_COLOR = 'rgba(0,0,0,1)';
SelectionWidget.PIVOT_RADIUS = SelectionWidget.HANDLE_RADIUS
SelectionWidget.ROTATION_HOTSPOT_RADIUS = 20;
SelectionWidget.ROTATION_HOTSPOT_FILLCOLOR = 'rgba(100,150,255,0.5)';
SelectionWidget.GHOST_STROKE_COLOR = 'rgba(0, 0, 0, 1.0)';
SelectionWidget.GHOST_STROKE_WIDTH = 1;

paper.PaperScope.inject({
    SelectionWidget: SelectionWidget,
});
