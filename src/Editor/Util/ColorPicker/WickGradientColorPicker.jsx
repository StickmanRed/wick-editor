import React, { Component } from 'react'

import ActionButton from 'Editor/Util/ActionButton/ActionButton';

import './_wickgradientcolorpicker.scss';
import WickGradient from 'Editor/Util/ColorPicker/WickGradient/WickGradient';
import WickColorPicker from 'Editor/Util/ColorPicker/WickColorPicker';
import tinycolor from 'tinycolor2';

class WickGradientColorPicker extends Component {
    constructor (props) {
        super(props);

        this.state = {
            selectedControlStopIndex: 0,
            colorOnDrag: null,
            outOfSyncColor: this.props.color
        };
        this.editLastColors = false;
        // Used to preserve color when switching solid/gradient
        this.lastReceivedColor = null;
        this.outOfSync = false;

        this.onChangeIntermediate = (color) => {
            this.props.onChangeIntermediate && this.props.onChangeIntermediate(color);
            this.setState({ colorOnDrag: color });
        }
        this.onColorChange = (color) => {
            this.props.onChangeComplete(color);
            this.props.updateLastColors(color, this.editLastColors);
            this.editLastColors = true;
            this.setState({ colorOnDrag: null });
        }
        this.onGradientChange = (color, stopColor) => {
            this.props.onChangeComplete(color);
            if (stopColor) {
                this.props.updateLastColors(stopColor, this.editLastColors);
                this.editLastColors = true;
            }
            this.setState({ colorOnDrag: null });
        }
        this.switchSolid = (color) => {
            // Exit if color isn't a gradient
            if (!color.stops) return;
            this.setState({ outOfSyncColor: color.stops[0].color });
            this.outOfSync = true;
        }
        this.switchGradient = (color) => {
            // Exit if color is a gradient
            if (color.stops) return;
            // Figma's default behavior
            let colorObject = tinycolor(color);
            let firstStop = colorObject.toRgbString();
            let secondStop = colorObject.toHsv();
            secondStop.v = (secondStop.v < 50) ? (secondStop.v + 40) : (secondStop.v - 40);
            secondStop = tinycolor(secondStop).toRgbString();

            this.setState({
                outOfSyncColor: {
                    origin: {x:0, y:0}, // TODO: Use top/bottom center bounds as endpoints
                    destination: {x:500, y:500},
                    stops: [{color: firstStop, offset: 0}, {color: secondStop, offset: 1}],
                    radial: false
                }
            });
            this.outOfSync = true;
        }
    }

    reducePaperColor (color) {
        if (!(color instanceof window.paper.Color)) return color;

        // Convert paper objects to plain objects that hold the same data
        if (!color.gradient) return color.toCSS();
        
        let stops = color.gradient.stops.map((stop, index, stops) => {
            let color = stop.color.toCSS();
            let offset = stop.offset;
            if (typeof offset !== 'number') {
                offset = index / (stops.length - 1);
            }
            return { color, offset };
        });
        let { origin, destination } = color;
        origin = { x: origin.x, y: origin.y };
        destination = { x: destination.x, y: destination.y };
        return { stops, origin, destination, radial: color.gradient.radial };
    }

    renderHeader (color) {
        return (
            <div className="wick-color-picker-header">
                {this.props.enableGradient &&
                <>
                    <div>{/* className="wick-color-picker-action-button">*/}
                        <ActionButton
                            color="tool"
                            id="color-picker-solid-button"
                            tooltip="Solid"
                            action={() => this.switchSolid(color)}
                            isActive={ () => !color.stops }
                            text="Solid" />
                    </div>
                    <div>{/* className="wick-color-picker-action-button spacer">*/}
                        <ActionButton
                            color="tool"
                            id="color-picker-gradient-button"
                            tooltip="Gradient"
                            action={() => this.switchGradient(color)}
                            isActive={ () => !!color.stops }
                            text="Gradient" />
                    </div>
                </>
                }
                <div className="color-picker-control-div" style={{marginLeft: 'auto'}}>
                    <div id="btn-color-picker-close">
                        <ActionButton color="tool" icon="closemodal" action={this.props.toggle} />
                    </div>
                </div>
            </div>
        );
    }

    render () {
        if (this.props.color !== this.lastReceivedColor) {
            this.lastReceivedColor = this.props.color;
            this.outOfSync = false;
        }
        let color = this.outOfSync ? this.state.outOfSyncColor : this.props.color;
        let index = 0;
        if (this.state.colorOnDrag !== null) {
            color = this.state.colorOnDrag;
        }
        else {
            color = this.reducePaperColor(color);
        }
        if (color.stops) {
            index = this.state.selectedControlStopIndex;
            index = Math.min(index, color.stops.length - 1);
        }

        return (
            <div className="wick-color-picker">
                {this.renderHeader(color)}
                {color.stops ?
                <WickGradient {...this.props}
                    selectedControlStopIndex={index}
                    selectControlStop={index => this.setState({selectedControlStopIndex: index})}
                    onChangeIntermediate={this.onChangeIntermediate}
                    onChangeComplete={this.onGradientChange}
                    color={color} /> :
                <WickColorPicker {...this.props}
                    onChangeIntermediate={this.onChangeIntermediate}
                    onChangeComplete={this.onColorChange}
                    color={color} />
                }
            </div>
        );
    }
}

export default WickGradientColorPicker;