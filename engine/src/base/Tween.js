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

/**
 * Class representing a tween.
 */
Wick.Tween = class extends Wick.Base {
    static get VALID_EASING_TYPES () {
        return [
            'none',
            'in', 'out', 'in-out',
            'in-cubic', 'out-cubic', 'in-out-cubic',
            'in-quartic', 'out-quartic', 'in-out-quartic',
            'in-quintic', 'out-quintic', 'in-out-quintic',
            'in-sine', 'out-sine', 'in-out-sine',
            'in-exp', 'out-exp', 'in-out-exp',
            'in-circle', 'out-circle', 'in-out-circle',
            'in-back', 'out-back', 'in-out-back',
            'in-bounce', 'out-bounce', 'in-out-bounce'
        ];
    }

    static _calculateTimeValue (tweenA, tweenB, playheadPosition) {
        var tweenAPlayhead = tweenA.playheadPosition;
        var tweenBPlayhead = tweenB.playheadPosition;
        var dist = tweenBPlayhead - tweenAPlayhead;
        var t = (playheadPosition - tweenAPlayhead) / dist;
        return t;
    }

    /**
     * Create a tween
     * @param {number} playheadPosition - the playhead position relative to the frame that the tween belongs to
     * @param {Wick.Transform} transformation - the transformation this tween will apply to child objects
     * @param {number} fullRotations - the number of rotations to add to the tween's transformation
     */
    constructor (args) {
        if(!args) args = {};
        super(args);

        this._playheadPosition = args.playheadPosition || 1;
        this._transformation = args.transformation || new Wick.Transformation();
        this.fullRotations = args.fullRotations === undefined ? 0 : args.fullRotations;
        this.easingType = args.easingType || 'none';

        this._originalLayerIndex = -1;
    }

    /**
     * Create a tween by interpolating two existing tweens.
     * @param {Wick.Tween} tweenA - The first tween
     * @param {Wick.Tween} tweenB - The second tween
     * @param {Number} playheadPosition - The point between the two tweens to use to interpolate
     */
    static interpolate (tweenA, tweenB, playheadPosition) {
        var interpTween = new Wick.Tween();

        // Calculate value (0.0-1.0) to pass to tweening function
        var t = Wick.Tween._calculateTimeValue(tweenA, tweenB, playheadPosition);

        // Interpolate every transformation attribute using the t value
        ["x", "y", "scaleX", "scaleY", "rotation", "opacity"].forEach(propName => {
            var tweenFn = tweenA._getTweenFunction();
            var tt = tweenFn(t);
            var valA = tweenA.transformation[propName];
            var valB = tweenB.transformation[propName];
            if(propName === 'rotation') {
                // Constrain rotation values to range of -180 to 180
                // (Disabled for now - a bug in paper.js clamps these for us)
                /*while(valA < -180) valA += 360;
                while(valB < -180) valB += 360;
                while(valA > 180) valA -= 360;
                while(valB > 180) valB -= 360;*/
                // Convert full rotations to 360 degree amounts
                valB += tweenA.fullRotations * 360;
            }
            interpTween.transformation[propName] = lerp(valA, valB, tt);
        });

        interpTween.playheadPosition = playheadPosition;
        return interpTween;
    }

    get classname () {
        return 'Tween';
    }

    _serialize (args) {
        var data = super._serialize(args);

        data.playheadPosition = this.playheadPosition;
        data.transformation = this._transformation.values;
        data.fullRotations = this.fullRotations;
        data.easingType = this.easingType;

        data.originalLayerIndex = this.layerIndex !== -1 ? this.layerIndex : this._originalLayerIndex;

        return data;
    }

    _deserialize (data) {
        super._deserialize(data);

        this.playheadPosition = data.playheadPosition;
        this._transformation = new Wick.Transformation(data.transformation);
        this.fullRotations = data.fullRotations;
        this.easingType = data.easingType;

        this._originalLayerIndex = data.originalLayerIndex;
    }

    /**
     * The playhead position of the tween.
     * @type {number}
     */
    get playheadPosition () {
        return this._playheadPosition;
    }

    set playheadPosition (playheadPosition) {
        this._playheadPosition = playheadPosition;
    }

    /**
     * The transformation representing the position, rotation and other elements of the tween.
     * @type {object} 
     */
    get transformation () {
        return this._transformation;
    }

    set transformation (transformation) {
        this._transformation = transformation;
    }

    /**
     * The type of interpolation to use for easing.
     * @type {string}
     */
    get easingType () {
        return this._easingType;
    }

    set easingType (easingType) {
        if(Wick.Tween.VALID_EASING_TYPES.indexOf(easingType) === -1) {
            console.warn('Invalid easingType. Valid easingTypes: ')
            console.warn(Wick.Tween.VALID_EASING_TYPES);
            return;
        }
        this._easingType = easingType;
    }

    /**
     * Remove this tween from its parent frame.
     */
    remove () {
        this.parent.removeTween(this);
    }

    /**
     * Set the transformation of a clip to this tween's transformation.
     * @param {Wick.Clip} clip - the clip to apply the tween transforms to.
     */
    applyTransformsToClip (clip) {
        clip.transformation = this.transformation.copy();
    }

    /**
     * The tween that comes after this tween in the parent frame.
     * @returns {Wick.Tween}
     */
    getNextTween () {
        if(!this.parentFrame) return null;

        var frontTween = this.parentFrame.seekTweenInFront(this.playheadPosition+1);
        return frontTween;
    }

    /**
     * Prevents tweens from existing outside of the frame's length. Call this after changing the length of the parent frame.
     */
    restrictToFrameSize () {
        var playheadPosition = this.playheadPosition;

        // Remove tween if playheadPosition is out of bounds
        if(playheadPosition < 1 || playheadPosition > this.parentFrame.length) {
            this.remove();
        }
    }

    /**
     * The index of the parent layer of this tween.
     * @type {number}
     */
    get layerIndex () {
        return this.parentLayer ? this.parentLayer.index : -1;
    }

    /**
     * The index of the layer that this tween last belonged to. Used when copying and pasting tweens.
     * @type {number}
     */
    get originalLayerIndex () {
        return this._originalLayerIndex;
    }

     /* retrieve Tween.js easing functions by name */
    _getTweenFunction () {
        return {
            'none': TWEEN.Easing.Linear.None,
            'in': TWEEN.Easing.Quadratic.In,
            'out': TWEEN.Easing.Quadratic.Out,
            'in-out': TWEEN.Easing.Quadratic.InOut,
            'in-cubic': TWEEN.Easing.Cubic.In,
            'out-cubic': TWEEN.Easing.Cubic.Out,
            'in-out-cubic': TWEEN.Easing.Cubic.InOut,
            'in-quartic': TWEEN.Easing.Quartic.In,
            'out-quartic': TWEEN.Easing.Quartic.Out,
            'in-out-quartic': TWEEN.Easing.Quartic.InOut,
            'in-quintic': TWEEN.Easing.Quintic.In,
            'out-quintic': TWEEN.Easing.Quintic.Out,
            'in-out-quintic': TWEEN.Easing.Quintic.InOut,
            'in-sine': TWEEN.Easing.Sinusoidal.In,
            'out-sine': TWEEN.Easing.Sinusoidal.Out,
            'in-out-sine': TWEEN.Easing.Sinusoidal.InOut,
            'in-exp': TWEEN.Easing.Exponential.In,
            'out-exp': TWEEN.Easing.Exponential.Out,
            'in-out-exp': TWEEN.Easing.Exponential.InOut,
            'in-circle': TWEEN.Easing.Circular.In,
            'out-circle': TWEEN.Easing.Circular.Out,
            'in-out-circle': TWEEN.Easing.Circular.InOut,
            'in-back': TWEEN.Easing.Back.In,
            'out-back': TWEEN.Easing.Back.Out,
            'in-out-back': TWEEN.Easing.Back.InOut,
            'in-bounce': TWEEN.Easing.Bounce.In,
            'out-bounce': TWEEN.Easing.Bounce.Out,
            'in-out-bounce': TWEEN.Easing.Bounce.InOut,
        }[this.easingType];
    }
}
