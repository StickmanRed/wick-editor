/* 
 * Copyright I don't know
 */

Wick.Tools.GradientTool = class extends Wick.Tool {
    /**
     * Creates a gradient tool.
     */
    constructor () {
        super();

        this.name = 'gradienttool';

        this.SELECTION_TOLERANCE = 3;
        this.CURSOR_DEFAULT = 'url("cursors/default.png") 32 32, auto';
        this.CURSOR_CREATE_STOP = 'url("cursors/gradMove.png") 32 32, auto';
        this.CURSOR_MOVE = 'url("cursors/move.png") 32 32, auto';
        this.currentCursorIcon = this.CURSOR_DEFAULT;
        this.transformMode = 'none';

        this.hitResult = new this.paper.HitResult();
        this.targetResult = new this.paper.HitResult();
        this.selectedStop = null;
        this.zoom = 1;
        this.scale = 1;

        this.endpoints = {origin: new this.paper.Point(0,0), destination: new this.paper.Point(0,0)};
        this.radial = false;

        // GUI constants
        this.ENDPOINT_RADIUS = 8; // 10
        this.ENDPOINT_FILL_COLOR = 'black'; // black
        this.OUTLINE_COLOR = 'grey'; // grey
        this.OUTLINE_WIDTH = 1; // 2
        this.STOP_RADIUS = 12;
        this.STOP_SELECTED_SCALING = 1.4; // 1.5
        this.SCALED_MOUSE_MAX_DISTANCE = this.STOP_RADIUS;
        this.SCALED_ENDPOINT_OFFSET_LENGTH = this.ENDPOINT_RADIUS + this.STOP_RADIUS;

        // GUI objects
        this._endpointLine = new this.paper.Path.Line({
            insert: false,
            from: [0, 0],
            to: [0, 0],
            strokeColor: this.OUTLINE_COLOR,
            strokeWidth: this.OUTLINE_WIDTH,
            applyMatrix: false,
            data: {
                gradientGUI: 'endpointLine'
            }
        });
        this._origin = new this.paper.Path.Circle({
            insert: false,
            center: [0, 0],
            radius: this.ENDPOINT_RADIUS,
            fillColor: this.ENDPOINT_FILL_COLOR,
            strokeColor: this.OUTLINE_COLOR,
            strokeWidth: this.OUTLINE_WIDTH,
            applyMatrix: false,
            data: {
                gradientGUI: 'origin'
            }
        });
        this._destination = new this.paper.Path.Rectangle({
            insert: false,
            center: [0, 0],
            size: [this.ENDPOINT_RADIUS * 2, this.ENDPOINT_RADIUS * 2],
            fillColor: this.ENDPOINT_FILL_COLOR,
            strokeColor: this.OUTLINE_COLOR,
            strokeWidth: this.OUTLINE_WIDTH,
            applyMatrix: false,
            data: {
                gradientGUI: 'destination'
            }
        });
        this._createStop = function (isPreview=false) {
            var stop = new this.paper.Path.Circle({
                center: [0, 0],
                radius: this.STOP_RADIUS,
                fillColor: '#000000',
                strokeColor: this.OUTLINE_COLOR,
                strokeWidth: this.OUTLINE_WIDTH,
                applyMatrix: false,
                data: {
                    gradientGUI: 'stop',
                    isTransparent: false
                }
            });
            var stopGroup = new this.paper.Group({
                insert: false,
                children: [stop],
                applyMatrix: false,
                data: {
                    gradientGUI: 'stop',
                    stopOffset: 0
                }
            });

            stopGroup.data.getColor = () => {
                if (stop.data.isTransparent) {
                    var color = stop.fillColor.clone();
                    color.alpha = 0;
                    return color;
                }
                return stop.fillColor;
            }
            stopGroup.data.setColor = color => {
                stop.fillColor = color;
                if (stop.fillColor.alpha === 0) {
                    // Hacky way to make sure color stop is selectable
                    stop.data.isTransparent = true;
                    stop.fillColor.alpha = 0.001;
                }
                else stop.data.isTransparent = false;
            }
            stopGroup.data.selectStop = (select=true) => {
                stop.scaling = select ? this.STOP_SELECTED_SCALING : 1;
            }
            if (isPreview) {
                stop.data.gradientGUI = 'previewStop';
                stopGroup.data.gradientGUI = 'previewStop';
            }
            return stopGroup;
        };
        this._colorStops = [];
        this._previewStop = this._createStop(true);
        this.layer = new this.paper.Layer();
    }

    /**
     * Generate the current cursor.
     * @type {string}
     */
    get cursor() {
        return this.currentCursorIcon;
    }
    set cursor(cursor) {
        this.currentCursorIcon = cursor;
    }

    get hitResult() {
        return this._hitResult;
    }
    set hitResult(hitResult) {
        this._hitResult = hitResult;
        this.hitObject = hitResult.item;
    }
    get targetResult() {
        return this._targetResult;
    }
    set targetResult(hitResult) {
        this._targetResult = hitResult;
        this.target = hitResult.item;
        if (this.target && this.target.data.wickUUID) {
            this.targetUUID = this.target.data.wickUUID;
            this.targetWick = this.project.getObjectByUUID(this.targetUUID);
        }
        else {
            this.targetUUID = null;
            this.targetWick = null;
        }
        this.targetIsStroke = hitResult.type === "curve";
    }
    _syncTargetFromUUID() {
        if (this.targetUUID) {
            this.targetWick = this.project.getObjectByUUID(this.targetUUID);
            this.target = this.targetWick.view.item;
            this._targetResult.item = this.target;
        }
        else {
            this.targetWick = null;
            this.target = null;
            this._targetResult.item = null;
        }
    }
    get targetOnScreen() {
        if (!this.target || !this.target.data.wickUUID) return false;
        if (!this.targetWick || !this.targetWick.parent) return false;
        if (!this.targetWick.parentClip || (this.targetWick.parentClip !== this.project.focus)) return false;
        return this.targetWick.onScreen;
    }
    get endpoints() {
        return this._endpoints;
    }
    set endpoints(endpoints) {
        this._endpoints = {
            origin: endpoints.origin ?? this._endpoints.origin,
            destination: endpoints.destination ?? this._endpoints.destination
        };
        this.lineVector = this.endpoints.destination.subtract(this.endpoints.origin);
        this.lineVectorUnit = this.lineVector.normalize();
    }
    get selectedStop() {
        return this._selectedStop;
    }
    set selectedStop(stop) {
        if (this._selectedStop) this._selectedStop.data.selectStop(false);
        this._selectedStop = stop;
        if (stop) stop.data.selectStop();
    }

    // Inspector attributes and actions
    get selectionType() {
        if (!this.target) return 'unknown';
        else if (this.selectedStop) return 'gradientstop';
        else if (this.targetIsStroke) return 'gradientstroke';
        else return 'gradientfill';
    }
    get gradientType() {
        return this.radial ? 'radial' : 'linear';
    }
    set gradientType(newType) {
        this.radial = (newType === 'radial');
        this._updateTarget();
        this.fireEvent({eventName: 'canvasModified', actionName: 'gradientToolModifyTarget'});
    }
    get originX() {
        return this.endpoints.origin.x;
    }
    set originX(newX) {
        var newPosition = new this.paper.Point(newX, this.endpoints.origin.y);
        this.endpoints = {origin: newPosition};
        var colorToModify = this.targetIsStroke ? this.target.strokeColor : this.target.fillColor;
        colorToModify.origin = newPosition;
        this._setupGUI();
        this.fireEvent({eventName: 'canvasModified', actionName: 'gradientToolModifyTarget'});
    }
    get originY() {
        return this.endpoints.origin.y;
    }
    set originY(newY) {
        var newPosition = new this.paper.Point(this.endpoints.origin.x, newY);
        this.endpoints = {origin: newPosition};
        var colorToModify = this.targetIsStroke ? this.target.strokeColor : this.target.fillColor;
        colorToModify.origin = newPosition;
        this._setupGUI();
        this.fireEvent({eventName: 'canvasModified', actionName: 'gradientToolModifyTarget'});
    }
    get destinationX() {
        return this.endpoints.destination.x;
    }
    set destinationX(newX) {
        var newPosition = new this.paper.Point(newX, this.endpoints.destination.y);
        this.endpoints = {destination: newPosition};
        var colorToModify = this.targetIsStroke ? this.target.strokeColor : this.target.fillColor;
        colorToModify.destination = newPosition;
        this._setupGUI();
        this.fireEvent({eventName: 'canvasModified', actionName: 'gradientToolModifyTarget'});
    }
    get destinationY() {
        return this.endpoints.destination.y;
    }
    set destinationY(newY) {
        var newPosition = new this.paper.Point(this.endpoints.destination.x, newY);
        this.endpoints = {destination: newPosition};
        var colorToModify = this.targetIsStroke ? this.target.strokeColor : this.target.fillColor;
        colorToModify.destination = newPosition;
        this._setupGUI();
        this.fireEvent({eventName: 'canvasModified', actionName: 'gradientToolModifyTarget'});
    }
    get lineAngle() {
        return this.lineVector.angle;
    }
    set lineAngle(newAngle) {
        var endpointMidpointOffset = this.lineVector.clone().divide(2);
        endpointMidpointOffset.angle = newAngle;
        var midpoint = this.endpoints.origin.add(this.endpoints.destination).divide(2);
        var newOrigin = midpoint.subtract(endpointMidpointOffset);
        var newDestination = midpoint.add(endpointMidpointOffset);
        this.endpoints = {origin: newOrigin, destination: newDestination};

        var colorToModify = this.targetIsStroke ? this.target.strokeColor : this.target.fillColor;
        colorToModify.origin = newOrigin;
        colorToModify.destination = newDestination;
        this._setupGUI();
        this.fireEvent({eventName: 'canvasModified', actionName: 'gradientToolModifyTarget'});
    }
    get stopColor() {
        if (!this.selectedStop) return undefined;
        return this.selectedStop.data.getColor();
    }
    set stopColor(newColor) {
        if (!this.selectedStop) return;
        this.selectedStop.data.setColor(newColor);
        this._updateTarget();
        this.fireEvent({eventName: 'canvasModified', actionName: 'gradientToolModifyTarget'});
    }
    get stopOpacity() {
        if (!this.selectedStop) return undefined;
        return this.selectedStop.data.getColor().alpha;
    }
    set stopOpacity(newOpacity) {
        if (!this.selectedStop) return;
        var newColor = this.selectedStop.data.getColor().clone();
        newColor.alpha = newOpacity;
        this.selectedStop.data.setColor(newColor);
        this._updateTarget();
        this.fireEvent({eventName: 'canvasModified', actionName: 'gradientToolModifyTarget'});
    }
    get stopOffset() {
        if (!this.selectedStop) return undefined;
        return this.selectedStop.data.stopOffset;
    }
    set stopOffset(newOffset) {
        if (!this.selectedStop) return;
        this._stopSetOffset(this.selectedStop, newOffset);
        this._updateTarget();
        this.fireEvent({eventName: 'canvasModified', actionName: 'gradientToolModifyTarget'});
    }

    reverseGradient() {
        this._colorStops.forEach(stop => {
            this._stopSetOffset(stop, 1 - stop.data.stopOffset);
        });

        this._updateTarget();
        this.fireEvent({eventName: 'canvasModified', actionName: 'gradientToolModifyTarget'});
    }
    deleteSelectedColorStop() {
        if (this.selectedStop) {
            if (this._colorStops.length <= 2) {
                // Don't remove the stop, paper.js gradients need at least two
                // Instead, emulate a one-color gradient
                var newColor = this._colorStops[1 - this._colorStops.indexOf(this.selectedStop)].data.getColor();
                this.selectedStop.data.setColor(newColor);
            }
            else {
                // Remove from the layer and stop list, then deselect this stop
                this.selectedStop.remove();
                this._colorStops.splice(this._colorStops.indexOf(this.selectedStop), 1);
            }
            this.selectedStop = null;
        }
        this._updateTarget();
        this.fireEvent({eventName: 'canvasModified', actionName: 'gradientToolModifyTarget'});
    }

    onActivate (e) {
        // fireEvent replaces the target paths for whatever reason. Find them again using the stored wickUUID
        this._syncTargetFromUUID();
        if (!this.targetOnScreen) {
            // Target is no longer visible for whatever reason
            // Destroy the GUI and deselect everything
            this.targetResult = new this.paper.HitResult();
            this._destroyGUI();
        }
        else {
            // Check if target's color changed
            if (!this.lastColor || !this.lastColor.equals(this.target.fillColor)) {
                // Reset GUI
                this.lastColor = this.target.fillColor;
                this._setupGUI();
            }
        }
    }

    onDeactivate (e) {
        // Destroy the GUI and deselect everything
        this.targetResult = new this.paper.HitResult();
        this._destroyGUI();
    }

    onMouseMove (e) {
        super.onMouseMove();

        this.hitResult = this._updateHitResult(e);
        var hitPath = this.hitObject;
        
        // If mouse is touching endpoint, set cursor to hover
        // Else if mouse is touching color stop, set cursor to hover
        
        var offset = this._offsetPointEndpointLineUnclamped(e.point);
        if (this.target &&
            (!hitPath || !hitPath.data.gradientGUI || hitPath.data.gradientGUI !== 'stop') &&
            this._distancePointEndpointLine(e.point) <= this.SCALED_MOUSE_MAX_DISTANCE &&
            (0 <= offset && offset <= 1)) {
            // If the tool has a target, the mouse isn't touching any of the color stops, and the mouse is above and within the endpoint line
            // Set cursor to add stop
            this.cursor = this.CURSOR_CREATE_STOP;

            // Update preview color stop
            this._interpolateStop(this._previewStop, e.point);
            // If preview color stop isn't added, add it
            if (!this._previewStop.parent) this._previewStop.addTo(this.layer);
        }
        else {
            // Else if preview color stop is added, remove it
            if (this._previewStop.parent) this._previewStop.remove();

            if (hitPath && hitPath.data.gradientGUI) {
                // Mouse is hovering over endpoints or color stops
                this.cursor = this.CURSOR_MOVE;
            }
            else this.cursor = this.CURSOR_DEFAULT;
        }
    }

    onMouseDown (e) {
        super.onMouseDown();

        this.hitResult = this._updateHitResult(e);
        var hitObject = this.hitObject;
        this.selectedStop = null;
        this.transformMode = this.getSetting('gradientToolMode');
        
        if (this.target && hitObject && hitObject.data.gradientGUI && hitObject !== this._endpointLine && hitObject !== this._previewStop) {
            // If the gradient tool has a target path and mouse clicked the GUI, and the endpoint line was not clicked
            if (hitObject.data.gradientGUI === 'stop') {
                // A color stop was clicked
                if (e.modifiers.shift) {
                    // Delete the color stop
                    this.selectedStop = hitObject;
                    this.deleteSelectedColorStop();
                }
                else {
                    // Select the color stop
                    this.selectedStop = hitObject;
                    //this._updateGUISelectedStops();
                    // Request a render from the project, but don't add to undo/redo stack
                    this.fireEvent({eventName: 'canvasRequestRender', actionName: 'gradientToolSelectStop'});
                }
            }
            else if (hitObject === this._origin || hitObject === this._destination) {
                // Request a render from the project, but don't add to undo/redo stack
                // Switch inspector to gradient
                this.fireEvent({eventName: 'canvasRequestRender', actionName: 'gradientToolSelectEndpoint'});
                // Save this endpoint data
                this.lastOrigin = this.endpoints.origin;
                this.lastDestination = this.endpoints.destination;
                this.lastEndpointVector = this.lineVector.clone();
                this.lastEndpointVector.length += 2 * this.SCALED_ENDPOINT_OFFSET_LENGTH;
            }
            this.cursor = this.CURSOR_MOVE;
        }
        else {
            var offset = this._offsetPointEndpointLineUnclamped(e.point);
            if (this.target && this._distancePointEndpointLine(e.point) <= this.SCALED_MOUSE_MAX_DISTANCE &&
                (0 <= offset && offset <= 1)) {
                // If mouse is near the endpoint line and inside endpoint line bounds
                // Create a new color stop
                var newStop = this._createStop();
                this._interpolateStop(newStop, e.point);
                // Add it to the stop list and the layer
                this._colorStops.push(newStop);
                newStop.addTo(this.layer);
                // Select this stop
                this.hitObject = newStop;
                this.selectedStop = newStop;
                // Scale the stop
                newStop.scaling = this.scale;

                // Update the target path to the new gradient
                this._updateTarget();

                // Remove the preview color stop
                this._previewStop.remove();

                this.fireEvent({eventName: 'canvasModified', actionName: 'gradientToolModifyTarget'});

                this.cursor = this.CURSOR_MOVE;
            }
            else if (hitObject) {
                // Else if something was clicked
                // This is a non-GUI path, so set it as the tool's target
                this.targetResult = this.hitResult;
                this.selectedStop = null;
                this._setupGUI();

                // Request a render from the project, but don't add to undo/redo stack
                this.fireEvent({eventName: 'canvasRequestRender', actionName: 'gradientToolSelectTarget'});

                this.cursor = this.CURSOR_DEFAULT;
            }
            else {
                // Else nothing was clicked, so destroy the GUI and deselect everything
                if (this.target) {
                    this.targetResult = this.hitResult;
                    this._destroyGUI();

                    
                    // Request a render from the project, but don't add to undo/redo stack
                    this.fireEvent({eventName: 'canvasRequestRender', actionName: 'gradientToolSelectTarget'});

                    this.cursor = this.CURSOR_DEFAULT;
                }
            }
        }

        this.setCursor(this.cursor);
    }

    onMouseDrag (e) {
        // If the preview color stop is still here, remove it
        if (this._previewStop.parent) this._previewStop.remove();
        
        if (this.hitObject && this.hitObject.data.gradientGUI) {
            // If the GUI is being dragged
            if (this.hitObject === this.selectedStop) {
                // If a color stop is being dragged, move it accordingly
                var offset = this._offsetPointEndpointLine(e.point);
                this._stopSetOffset(this.selectedStop, offset);
            }
            else {
                // Else, an endpoint is being dragged, move it to the mouse cursor
                // (Mode is uniform) XOR (Shift is pressed)
                var moveBothEndpoints = (this.transformMode === 'uniform') === !e.modifiers.shift;
                if (this.hitObject === this._origin) {
                    this._origin.position = e.point;
                    if (moveBothEndpoints) {
                        this._destination.position = e.point.add(this.lastEndpointVector);
                    }
                    else {
                        var endpointOffset = this.lastDestination.subtract(e.point).normalize(this.SCALED_ENDPOINT_OFFSET_LENGTH);
                        this._destination.position = this.lastDestination.add(endpointOffset);
                    }
                }
                else if (this.hitObject === this._destination) {
                    this._destination.position = e.point;
                    if (moveBothEndpoints) {
                        this._origin.position = e.point.subtract(this.lastEndpointVector);
                    }
                    else {
                        var endpointOffset = e.point.subtract(this.lastOrigin).normalize(this.SCALED_ENDPOINT_OFFSET_LENGTH);
                        this._origin.position = this.lastOrigin.subtract(endpointOffset);
                    }
                }
                // Update the rest of the GUI
                this._updateGUIFromEndpoints();
            }
            // Push changes to the tool's target
            this._updateTarget();
        }
    }

    onMouseUp (e) {
        // If the GUI was dragged, push changes to the tool's target one last time
        if (this.hitObject && this.hitObject.data.gradientGUI) {
            this._updateTarget();
            
            this.fireEvent({eventName: 'canvasModified', actionName: 'gradientToolModifyTarget'});
        }
    }

    _updateZoom (zoom) {
        if (zoom === this.zoom) return;
        this.zoom = zoom;
        this.scale = 1 / zoom;

        // Scale certain constants
        this.SCALED_ENDPOINT_OFFSET_LENGTH = (this.ENDPOINT_RADIUS + this.STOP_RADIUS) * this.scale;
        this.SCALED_MOUSE_MAX_DISTANCE = this.STOP_RADIUS * this.scale;
        // Scale endpoints
        this._origin.scaling = this.scale;
        this._destination.scaling = this.scale;
        var endpointOffset = this.lineVectorUnit.multiply(this.SCALED_ENDPOINT_OFFSET_LENGTH);
        this._origin.position = this.endpoints.origin.subtract(endpointOffset);
        this._destination.position = this.endpoints.destination.add(endpointOffset);
        // Scale endpoint line
        this._endpointLine.strokeWidth = this.OUTLINE_WIDTH * this.scale;
        this._endpointLine.segments[0].point = this._origin.position;
        this._endpointLine.segments[1].point = this._destination.position;
        // Scale stops
        this._colorStops.forEach(stop => {stop.scaling = this.scale;});
        // Scale preview stop
        this._previewStop.scaling = this.scale;
    }

    _updateHitResult (e) {
        var newHitResult = this.paper.project.hitTest(e.point, {
            fill: true,
            stroke: true,
            curves: true,
            segments: false,
            tolerance: this.SELECTION_TOLERANCE,
            match: (result => {
                return !result.item.data.isBorder
                    && result.item.data.gradientGUI !== 'previewStop';
            }),
        });
        if(!newHitResult) newHitResult = new this.paper.HitResult();

        if(newHitResult.item && !newHitResult.item.data.isSelectionBoxGUI) {
            // You can't select children of compound paths, you can only select the whole thing.
            if (newHitResult.item.parent.className === 'CompoundPath') {
                newHitResult.item = newHitResult.item.parent;
            }

            // You can't select individual children in a group, you can only select the whole thing.
            if (newHitResult.item.parent.parent) {
                newHitResult.type = 'fill';

                while (newHitResult.item.parent.parent) {
                    newHitResult.item = newHitResult.item.parent;
                }
            }

            // this.paper.js has two names for strokes+curves, we don't need that extra info
            if(newHitResult.type === 'stroke') {
                newHitResult.type = 'curve';
            }

            // Mousing over rasters acts the same as mousing over fills.
            if(newHitResult.type === 'pixel') {
                newHitResult.type = 'fill';
            };
        }

        // The gradient tool can only target paths.
        if (newHitResult.item && !newHitResult.item.data.gradientGUI && (newHitResult.item.className !== 'Path' && newHitResult.item.className !== 'CompoundPath')) {
            newHitResult = new this.paper.HitResult();
        }

        return newHitResult;
    }

    _updateEndpointVectors () {
        // Update this.endpoints
        var originGUI = this._origin.position;
        var destinationGUI = this._destination.position;
        var lineVectorUnit = destinationGUI.subtract(originGUI).normalize();
        // The endpoints' GUI representation is offset from the actual endpoints
        var endpointOffset = lineVectorUnit.multiply(this.SCALED_ENDPOINT_OFFSET_LENGTH);
        this.endpoints = {
            origin: originGUI.add(endpointOffset),
            destination: destinationGUI.subtract(endpointOffset)
        };
    }
    _distancePointEndpointLine (point) {
        var pointVector = point.subtract(this.endpoints.origin);
        return Math.abs(pointVector.cross(this.lineVectorUnit));
    }
    _positionOffsetEndpointLine (offset) {
        return this.endpoints.origin.add(this.lineVector.multiply(offset));
    }
    _offsetPointEndpointLineUnclamped (point) {
        var pointVector = point.subtract(this.endpoints.origin);
        var distance = pointVector.dot(this.lineVectorUnit);
        var offset = distance / this.lineVector.length;
        return offset;
    }
    _offsetPointEndpointLine (point) {
        // Clamp offset between 0 and 1
        var offset = this._offsetPointEndpointLineUnclamped(point);
        offset = Math.max(Math.min(offset, 1), 0);
        return offset;
    }

    _updateGUIFromEndpoints () {
        // Update this.endpoints
        this._updateEndpointVectors();
        // Update endpoint line
        this._endpointLine.segments[0].point = this._origin.position;
        this._endpointLine.segments[1].point = this._destination.position;
        // Update stops
        this._colorStops.forEach(stop => {
            stop.position = this._positionOffsetEndpointLine(stop.data.stopOffset);
        });
    }

    _updateGUISelectedStops () {
        // NOTE: Should be obsolete if selectedStop is updated correctly.
        // Loop through all color stops and run the select function
    }
    _stopSetOffset (stop, offset) {
        // Clamp offset
        offset = Math.max(Math.min(offset, 1), 0);
        // Set offset in data
        stop.data.stopOffset = offset;
        // Update position accordingly
        stop.position = this._positionOffsetEndpointLine(offset);
    }
    _interpolateStop(stop, point) {
        // Automatically set stop color and offset based on point
        // Find offset of point
        var offset = this._offsetPointEndpointLine(point);

        // Find which two stops offset is between
        // Assume color stops are unsorted (for now at least). Iterate over the array and keep track of upper and lower bounds of offset
        var prevStop, nextStop;
        var prevOffset = 0; var nextOffset = 1;
        this._colorStops.forEach(stop => {
            var stopOffset = stop.data.stopOffset;
            if (prevOffset <= stopOffset && stopOffset <= offset) {
                prevStop = stop;
                prevOffset = stopOffset;
            }
            else if (offset <= stopOffset && stopOffset <= nextOffset) {
                nextStop = stop;
                nextOffset = stopOffset;
            }
        });

        // Find color at offset
        if (!prevStop) {
            // Offset is the leftmost stop, use the color of nextStop
            var color = nextStop.data.getColor().clone();
        }
        else if (!nextStop) {
            // Offset is the rightmost stop, use the color of prevStop
            var color = prevStop.data.getColor().clone();
        }
        else {
            // Both stops exist, interpolate the color
            var offsetRelative = (offset - prevOffset) / (nextOffset - prevOffset);
            var prevColor = prevStop.data.getColor();
            var nextColor = nextStop.data.getColor()
            var color = prevColor.add(nextColor.subtract(prevColor).multiply(offsetRelative));
            color.alpha = prevColor.alpha + (nextColor.alpha - prevColor.alpha) * offsetRelative;
        }

        // Set color and offset of stop
        stop.data.setColor(color);
        this._stopSetOffset(stop, offset);
    }

    _setupGUI () {
        // Remove stops
        this._colorStops.forEach(stop => stop.remove());

        // Pull gradient information from target object
        var color = (this.targetIsStroke ? this.target.strokeColor : this.target.fillColor) ?? new this.paper.Color(0);
        if (color.gradient) {
            // Color is a gradient, get information from gradient
            var {origin, destination, gradient} = color;
            var stopObjects = gradient.stops.map(paperStop => ({color: paperStop.color, offset: paperStop.offset}));
            this.radial = gradient.radial;
        }
        else {
            // Color is a solid color, create a new gradient
            var origin = this.target.bounds.leftCenter;
            var destination = this.target.bounds.rightCenter;
            var stopObjects = [{color: color, offset: 0}, {color: color.clone(), offset: 1}]
            this.radial = false;
        }

        // Apply info to GUI objects
        this.endpoints = {origin: origin, destination: destination};
        stopObjects.forEach((stopObject, idx) => {
            if (idx >= this._colorStops.length) {
                this._colorStops.push(this._createStop());
            }
            var stop = this._colorStops[idx];
            stop.data.setColor(stopObject.color);
            this._stopSetOffset(stop, stopObject.offset);
            stop.scaling = this.scale;
        });
        this._colorStops.length = stopObjects.length;

        var endpointOffset = this.lineVectorUnit.multiply(this.SCALED_ENDPOINT_OFFSET_LENGTH);
        var originOffset = origin.subtract(endpointOffset)
        var destinationOffset = destination.add(endpointOffset)
        this._origin.position = originOffset;
        this._destination.position = destinationOffset;
        this._endpointLine.segments[0].point = originOffset;
        this._endpointLine.segments[1].point = destinationOffset;

        // Add GUI to this.layer
        this._endpointLine.addTo(this.layer);
        this._origin.addTo(this.layer);
        this._destination.addTo(this.layer);
        this._colorStops.forEach(stop => stop.addTo(this.layer));
    }
    _updateTarget () {
        // Build gradient object
        var stops = this._colorStops.map(stop => [stop.data.getColor(), stop.data.stopOffset]);
        var colorObject = {
            gradient: {
                stops: stops,
                radial: this.radial
            },
            origin: this.endpoints.origin,
            destination: this.endpoints.destination
        }

        // Set color of target to gradient
        if (this.targetIsStroke) this.target.strokeColor = colorObject;
        else this.target.fillColor = colorObject;
    }
    _destroyGUI () {
        // Remove GUI from this.layer
        this._endpointLine.remove();
        this._origin.remove();
        this._destination.remove();
        this._colorStops.forEach(stop => stop.remove());
        this._previewStop.remove();
    }
}