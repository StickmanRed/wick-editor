import React, { Component } from 'react'

import  ActionButton  from 'Editor/Util/ActionButton/ActionButton';

import './_wickcolorpicker.scss';
import { CustomPicker } from 'react-color';
import WickSwatch from 'Editor/Util/ColorPicker/WickSwatch/WickSwatch'

var { Saturation, Hue, Alpha, Checkboard, Swatch } = require('react-color/lib/components/common');
var { SketchFields } = require('react-color/lib/components/sketch/SketchFields');

function WickControlPointer (props) {
    let color;
    if (props.pointerType === "saturation") {
        color = `rgb(${props.rgb.r},${props.rgb.g},${props.rgb.b})`;
    }
    else if (props.pointerType === "hue") {
        color = `hsl(${props.hsl.h},100%,50%)`;
    }
    else if (props.pointerType === "alpha") {
        // Mimic transparent against a white background
        let newLight = 1 + props.hsl.a * (props.hsl.l - 1);
        color = `hsl(${props.hsl.h},${props.hsl.s*100}%,${newLight*100}%)`;
    }
    else {
        color = props.color;
    }
    return (<div className="wick-color-picker-control-pointer" style={{backgroundColor: color}}/>);
}

class WickColorPicker extends Component {
    renderSwatchColumn = (colorList, i) => {
        return (
            <div key={"swatch-color-column-" + i} className="wick-swatch-picker-column">
                {colorList.map((color,i) => {
                    return (
                        <WickSwatch
                            color={color}
                            onChangeComplete={this.props.onChangeComplete}
                            selectedColor={this.props.color}
                            key={"swatch-color-"+color+"-"+i} />
                    );
                })}
            </div>
        );
    }

    renderSwatchbook = (colors) => {
        return (
            <div className="wick-swatch-picker-book">
                {colors.map((colorList, i) => {
                    return (this.renderSwatchColumn(colorList, i));
                })}
            </div>
        );
    }

    renderSwatches = () => {
        let colors = [
            ["#ff0000","#ffcccc","#ff9999","#ff4d4d","#cc0000","#800000"],
            ["#ff8000","#ffe6cc","#ffcc99","#ffa64d","#cc6600","#804000"],
            ["#ffff00","#ffffcc","#ffff99","#ffff4d","#cccc00","#808000"],
            ["#00ff00","#ccffcc","#99ff99","#4dff4d","#00cc00","#008000"],
            ["#00ff80","#ccffe6","#99ffcc","#4dffa6","#00cc66","#008040"],
            ["#00ffff","#ccffff","#99ffff","#4dffff","#00cccc","#008080"],
            ["#0080ff","#cce6ff","#99ccff","#4da6ff","#0066cc","#004080"],
            ["#0000ff","#ccccff","#9999ff","#4d4dff","#0000cc","#000080"],
            ["#8000ff","#e6ccff","#cc99ff","#a64dff","#6600cc","#400080"],
            ["#ff00ff","#ffccff","#ff99ff","#ff4dff","#cc00cc","#800080"],
            ["#ff0080","#ffcce6","#ff99cc","#ff4da6","#cc0066","#800040"],
            ["#000000","#ffffff","#cccccc","#999999","#666666","#333333"]
        ]

        return (
            <div className="wick-swatch-color-picker-body">
                {this.renderSwatchbook(colors)}
            </div>
        );
    }

    renderSwatchContainer = (colors) => {
        return (
            <div className="wick-color-picker-swatches-container">
                {colors.map((color, i) => {
                    return (
                        <div
                            key={"color-swatch-" + color + "-" + i}
                            className="wick-color-picker-small-swatch">
                            <Swatch
                                color={color}
                                style={{default: {}, ":focus": {outline: "2px solid white"}}}
                                onClick={(color) => {this.props.onChangeComplete(color)}}  />
                        </div>
                    );
                })}
            </div>
        );
    }

    renderSpectrum = () => {
        let activeColor = this.props.color;
        let styles = {
            activeColor: {
                position:'absolute',
                width: "100%",
                height: "100%",
                backgroundColor: activeColor,
            }
        }
        
        let colors = ['#D0021B', '#F8E71C', '#7ED321', '#4A90E2', '#000000', '#4A4A4A', '#FFFFFF', '#FFFFFF00']
        let lastUsedColorsDefaults = ["#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000"]
        let lastColors = this.props.lastColorsUsed || lastUsedColorsDefaults;
        return (
            <div className="wick-color-picker-spectrum">
                <div className="wick-color-picker-saturation">
                    <Saturation {...this.props}
                        color={activeColor}
                        pointer={WickControlPointer}
                        pointerType="saturation" />
                </div>
                <div className="wick-color-picker-control-body">
                    <div id="btn-color-picker-dropper">
                        <ActionButton
                            icon="eyedropper"
                            id="color-picker-eyedropper"
                            tooltip="Eyedropper"
                            color="tool"
                            action={this.openEyedropper} />
                    </div>
                    <div id="wick-color-picker-bar-container">
                        <div className="wick-color-picker-control-bar wick-color-picker-hue-bar">
                            <Hue {...this.props}
                                height={11}
                                color={activeColor}
                                pointer={WickControlPointer}
                                pointerType="hue" />
                        </div>
                        <div className="wick-color-picker-control-bar wick-color-picker-alpha-bar">
                            <Alpha {...this.props}
                                color={activeColor}
                                pointer={WickControlPointer}
                                pointerType="alpha"
                                style={
                                    {
                                        container: {margin: "0 8px"}, // $color-picker-pointer-radius
                                        gradient: {
                                            background: `linear-gradient(to right, rgba(${ this.props.rgb.r },${ this.props.rgb.g },${ this.props.rgb.b }, 0) 8px,
                                            rgba(${ this.props.rgb.r },${ this.props.rgb.g },${ this.props.rgb.b }, 1) calc(100% - 8px))`
                                        },
                                    }
                                } />
                        </div>
                    </div>
                    <div className="wick-color-picker-color-block-container">
                        <Checkboard />
                        <div style={styles.activeColor} />
                    </div>
                </div>
                <SketchFields {...this.props}
                    color={activeColor}
                    aria-label="color options" />
                {this.renderSwatchContainer(colors)}
                {this.renderSwatchContainer(lastColors)}
            </div>
        );
    }

    render () {
        if (this.props.colorPickerType === "swatches" || !this.props.colorPickerType) {
            return this.renderSwatches();
        } else if (this.props.colorPickerType === "spectrum") {
            return this.renderSpectrum();
        };
    }

    openEyedropper = () => {
        window.editor.setActiveTool('eyedropper');
        window.editor._onEyedropperPickedColor = this.props.onChange;
    }
}

export default CustomPicker(WickColorPicker);
