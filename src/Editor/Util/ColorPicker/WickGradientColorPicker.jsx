import React, { Component } from 'react'

import ActionButton from 'Editor/Util/ActionButton/ActionButton';

import './_wickgradientcolorpicker.scss';
import WickGradient from 'Editor/Util/ColorPicker/WickGradient/WickGradient';
import WickColorPicker from 'Editor/Util/ColorPicker/WickColorPicker';

class WickGradientColorPicker extends Component {
    constructor () {
        super();

        this.state = {
            selectedControlStopIndex: 0,
            colorIntermediate: null
        };
        this.editLastColors = false;

        this.onChangeIntermediate = (color) => {
            this.props.onChangeIntermediate && this.props.onChangeIntermediate(color);
            this.setState({ colorIntermediate: color });
        }
        this.onColorChange = (color) => {
            this.props.onChangeComplete(color);
            this.props.updateLastColors(color, this.editLastColors);
            this.editLastColors = true;
            this.setState({ colorIntermediate: null });
        }
        this.onGradientChange = (color, stopColor) => {
            this.props.onChangeComplete(color);
            if (stopColor) {
                this.props.updateLastColors(stopColor, this.editLastColors);
                this.editLastColors = true;
            }
            this.setState({ colorIntermediate: null });
        }
    }

    renderHeader () {
        return (
            <div className="wick-color-picker-header">
                <div className="wick-color-picker-action-button">
                    <ActionButton
                        color="tool"
                        id="color-picker-swatches-button"
                        tooltip="Swatches"
                        action={() => {this.props.changeColorPickerType("swatches")}}
                        isActive={ () => this.props.colorPickerType === "swatches" }
                        icon="swatches" />
                </div>
                <div className="wick-color-picker-action-button spacer">
                    <ActionButton
                        color="tool"
                        id="color-picker-spectrum-button"
                        tooltip="Spectrum"
                        action={() => {this.props.changeColorPickerType("spectrum")}}
                        isActive={ () => this.props.colorPickerType === "spectrum" }
                        icon="spectrum" />
                </div>
                <div className="color-picker-control-div">
                    <div id="btn-color-picker-close">
                        <ActionButton color="tool" icon="closemodal" action={this.props.toggle} />
                    </div>
                </div>
            </div>
        );
    }

    render () {
        let color = this.props.color;
        let index = 0;
        if (this.state.colorIntermediate !== null) {
            color = this.state.colorIntermediate;
            if (color.stops) {
                index = this.state.selectedControlStopIndex;
                index = Math.min(index, color.stops.length - 1);
            }
        }
        else {
            if (color instanceof window.paper.Color) {
                if (!color.gradient) color = color.toCSS();
                else {
                    let stops = color.gradient.stops;
                    let stopsLastIndex = stops.length - 1;
                    stops = stops.map((paperStop, index) => {
                        let color = paperStop.color.toCSS();
                        let offset = paperStop.offset;
                        if (typeof offset !== 'number') offset = index / stopsLastIndex;
                        return { color, offset };
                    });
                    let { origin, destination } = color;
                    color = { stops, origin, destination };
                    
                    index = this.state.selectedControlStopIndex
                    index = Math.min(index, stopsLastIndex);
                }
            }
        }

        return (
            <div className="wick-color-picker">
                {this.renderHeader()}
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