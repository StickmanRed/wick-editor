import React, { Component } from 'react'

import './_wickgradient.scss';
import  ActionButton  from 'Editor/Util/ActionButton/ActionButton';
import WickColorPicker from 'Editor/Util/ColorPicker/WickColorPicker';
import { GradientSlider, ColorPickerInput } from 'Editor/Util/ColorPicker/ColorPickerComponents/ColorPickerComponents';
import tinycolor from 'tinycolor2';

class WickGradient extends Component {
    interpolateColor = (offset) => {
        const sortedStops = this.controlStops.toSorted((objectA, objectB) => objectA.offset - objectB.offset);
        if (offset <= sortedStops[0].offset) return sortedStops[0].color;
        if (offset >= sortedStops[sortedStops.length - 1].offset) return sortedStops[sortedStops.length - 1].color;
        let next = sortedStops.findIndex(stop => (stop.offset > offset));
        let firstStop = sortedStops[next - 1];
        let nextStop = sortedStops[next];
        let percent = (offset - firstStop.offset) / (nextStop.offset - firstStop.offset) * 100;
        return tinycolor.mix(firstStop.color, nextStop.color, percent).toRgbString();
    }

    controlStopMouseDown = (index) => this.props.selectControlStop(index);
    containerMouseDown = (offset) => {
        let color = this.interpolateColor(offset.x);
        this.controlStops.push({ color, offset: offset.x });
        this.props.selectControlStop(this.controlStops.length - 1);
        this.onChangeIntermediate();
    }
    colorSelectedStop = (color) => {
        let offset = this.controlStops[this.props.selectedControlStopIndex].offset;
        this.controlStops[this.props.selectedControlStopIndex] = { color, offset };
    }
    offsetSelectedStop = (offset) => {
        let color = this.controlStops[this.props.selectedControlStopIndex].color;
        this.controlStops[this.props.selectedControlStopIndex] = { color, offset };
    }
    gradientObject = () => ({
        stops: this.controlStops,
        origin: this.origin,
        destination: this.destination,
        radial: this.radial
    })
    onChangeIntermediate = () => this.props.onChangeIntermediate(this.gradientObject());
    onChangeComplete = (stopColor) => this.props.onChangeComplete(this.gradientObject(), stopColor);
    onChangeEndpoint = (endpoint, override) => {
        Object.assign(endpoint, override);
        this.props.onChangeComplete(this.gradientObject());
    }
    onChangeRadial = (radial) => {
        this.radial = radial;
        this.props.onChangeComplete(this.gradientObject());
    }
    renderHeader = () => {
        return (
            <div className="wick-color-picker-header">
                <div>{/* className="wick-color-picker-action-button">*/}
                    <ActionButton
                        color="tool"
                        id="color-picker-gradient-linear-button"
                        tooltip="Linear"
                        action={ () => this.onChangeRadial(false) }
                        isActive={ () => !this.radial }
                        text="Linear" />
                </div>
                <div style={{marginRight: 'auto'}}>{/* className="wick-color-picker-action-button spacer">*/}
                    <ActionButton
                        color="tool"
                        id="color-picker-gradient-radial-button"
                        tooltip="Radial"
                        action={ () => this.onChangeRadial(true) }
                        isActive={ () => this.radial }
                        text="Radial" />
                </div>
            </div>
        );
    }
    renderGradientBackground () {
        let linearGradient = 'linear-gradient(to right';
        const sortedControlStops = this.controlStops.toSorted((objectA, objectB) => objectA.offset - objectB.offset);
        sortedControlStops.forEach(controlStopObject => {
            linearGradient += `, ${controlStopObject.color} ${controlStopObject.offset * 100}%`
        });
        linearGradient += ')';
        return linearGradient;
    }
    renderGradientInfo () {
        return (
            <div className="wick-color-picker-gradient-fields">
                <div className="wick-color-picker-gradient-fields-row">
                    <ColorPickerInput className="wick-color-picker-gradient-field wick-color-picker-field-start-x"
                        labelBefore="Start X"
                        type="numeric"
                        value={this.origin.x}
                        onChange={x => this.onChangeEndpoint(this.origin, { x })} />
                    <ColorPickerInput className="wick-color-picker-gradient-field wick-color-picker-field-start-y"
                        labelBefore="Start Y"
                        type="numeric"
                        value={this.origin.y}
                        onChange={y => this.onChangeEndpoint(this.origin, { y })} />
                </div>
                <div className="wick-color-picker-gradient-fields-row">
                    <ColorPickerInput className="wick-color-picker-gradient-field wick-color-picker-field-end-x"
                        labelBefore="End X"
                        type="numeric"
                        value={this.destination.x}
                        onChange={x => this.onChangeEndpoint(this.destination, { x })} />
                    <ColorPickerInput className="wick-color-picker-gradient-field wick-color-picker-field-end-y"
                        labelBefore="End Y"
                        type="numeric"
                        value={this.destination.y}
                        onChange={y => this.onChangeEndpoint(this.destination, { y })} />
                </div>
            </div>
        )
    }

    render () {
        this.controlStops = [...this.props.color.stops];
        this.origin = {...this.props.color.origin};
        this.destination = {...this.props.color.destination};
        this.radial = this.props.color.radial;

        return (
            <>
                {this.renderHeader()}
                <GradientSlider className="wick-color-picker-gradient"
                    containerDown={this.containerMouseDown}
                    controlStopDown={this.controlStopMouseDown}
                    onMouseMove={offset => { this.offsetSelectedStop(offset.x); this.onChangeIntermediate(); }}
                    onMouseUp={this.onChangeComplete}
                    stops={this.controlStops}
                    background={this.renderGradientBackground()} />
                {this.renderGradientInfo()}
                <WickColorPicker {...this.props}
                    onChangeIntermediate={color => { this.colorSelectedStop(color); this.onChangeIntermediate(); }}
                    onChangeComplete={color => { this.colorSelectedStop(color); this.onChangeComplete(color); }}
                    color={this.controlStops[this.props.selectedControlStopIndex].color} />
            </>
        );
    }
}

export default WickGradient;