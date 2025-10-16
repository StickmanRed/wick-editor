import React, { Component } from 'react'

import ActionButton from 'Editor/Util/ActionButton/ActionButton';

import './_wickgradientcolorpicker.scss';
import WickColorPicker  from 'Editor/Util/ColorPicker/WickColorPicker';

class WickGradientColorPicker extends Component {
    onColorChange = (color, event) => {
        this.props.onChangeComplete(color);
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
                        <ActionButton color="tool" icon="closemodal" action={this.props.toggle}/>
                    </div>
                </div>
            </div>
        );
    }

    render () {
        let color = this.props.color;
        if (color instanceof window.paper.Color) {
            color = color.toCSS();
        }
        return (
            <div className="wick-color-picker">
                {this.renderHeader()}
                <WickColorPicker {...this.props}
                    onChangeComplete={this.onColorChange}
                    color={color}
                />
            </div>
        );
    }
}

export default WickGradientColorPicker;