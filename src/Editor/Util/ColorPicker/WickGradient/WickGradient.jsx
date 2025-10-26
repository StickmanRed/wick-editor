import React, { Component } from 'react'

import './_wickgradient.scss';
import WickCustomSlider from 'Editor/Util/ColorPicker/WickCustomSlider/WickCustomSlider';
import WickColorPicker from 'Editor/Util/ColorPicker/WickColorPicker';

function WickGradientControlStop (props) {
    return (
        <div className={props.className}
            onMouseDown={props.onMouseDown}
            style={props.style}
            data-wick-pointer-index={props.stopIndex} />
    );
}

class WickGradient extends Component {
    controlStopMouseDown = (index) => this.props.selectControlStop(index);
    containerMouseDown = () => this.props.selectControlStop(0); // TODO: Create a new control stop
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
        origin: this.props.color.origin,
        destination: this.props.color.destination
    })
    onChangeIntermediate = () => this.props.onChangeIntermediate(this.gradientObject());
    onChangeComplete = (stopColor) => this.props.onChangeComplete(this.gradientObject(), stopColor);

    renderGradientBackground () {
        let linearGradient = 'linear-gradient(to right';
        const sortedControlStops = this.controlStops.toSorted((objectA, objectB) => objectA.offset - objectB.offset);
        sortedControlStops.forEach(controlStopObject => {
            linearGradient += `, ${controlStopObject.color} ${controlStopObject.offset * 100}%`
        });
        linearGradient += ')';
        return linearGradient;
    }

    render () {
        this.controlStops = [...this.props.color.stops];

        return (
            <>
                <WickCustomSlider className="wick-color-picker-gradient"
                    onMouseDownContainer={this.containerMouseDown}
                    onMouseDownPointer={this.controlStopMouseDown}
                    onMouseMove={offset => { this.offsetSelectedStop(offset.x); this.onChangeIntermediate(); }}
                    onMouseUp={this.onChangeComplete}
                    pointerComponent={WickGradientControlStop}
                    pointers={this.controlStops}
                    pointersDirection={'x'}
                    style={{
                        container: {
                            backgroundImage: this.renderGradientBackground()
                        }
                    }} />
                <WickColorPicker {...this.props}
                    onChangeIntermediate={color => { this.colorSelectedStop(color); this.onChangeIntermediate(); }}
                    onChangeComplete={color => { this.colorSelectedStop(color); this.onChangeComplete(color); }}
                    color={this.controlStops[this.props.selectedControlStopIndex].color} />
            </>
        );
    }
}

export default WickGradient;