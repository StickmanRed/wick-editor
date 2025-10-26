import React, { Component, createRef } from 'react'

class WickCustomSlider extends Component {
    constructor () {
        super();
        this.container = createRef(null);
    }
    calculateOffset = (e) => {
        if (!this.container.current) return;
        const container = this.container.current;

        // e.pageX for MouseEvent, e.touches[0].pageX for TouchEvent
        const x = (typeof e.pageX === 'number') ? e.pageX : e.touches[0].pageX;
        const left = x - (container.getBoundingClientRect().left + window.pageXOffset);
        const y = (typeof e.pageY === 'number') ? e.pageY : e.touches[0].pageY;
        const top = y - (container.getBoundingClientRect().top + window.pageYOffset);
        
        let offsetX = Math.max(Math.min(left / container.clientWidth, 1), 0);
        let offsetY = Math.max(Math.min(top / container.clientHeight, 1), 0);
        return { x: offsetX, y: offsetY };
    }
    
    bindEvents = () => {
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mouseup', this.handleMouseUp);
    }
    unbindEvents = () => {
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mouseup', this.handleMouseUp);
    }
    handleMouseDownPointer = (e) => {
        if (!this.props.onMouseDownPointer) return this.handleMouseDownContainer(e);
        this.props.onMouseDownPointer(e.target.dataset.wickPointerIndex);
        this.bindEvents();
    }
    handleMouseDownContainer = (e) => {
        // Check if one of the pointers were clicked
        if (e.target !== e.currentTarget) return;
        this.props.onMouseDownContainer(this.calculateOffset(e));
        this.bindEvents();
    }
    handleMouseMove = (e) => {
        this.props.onMouseMove(this.calculateOffset(e));
    }
    handleMouseUp = (e) => {
        this.unbindEvents();
        this.props.onMouseUp(this.calculateOffset(e));
    }

    renderPointers () {
        return (
            <>
                {this.props.pointers.map((pointerItem, index) => {
                    let offset = (pointerItem.offset === undefined) ? pointerItem : pointerItem.offset;
                    let style = {};
                    if (typeof offset === 'number' && this.props.pointersDirection) {
                        if (this.props.pointersDirection.includes('x')) style.left = `${offset * 100}%`;
                        else style.top = `${offset * 100}%`;
                    }
                    else style = { left: `${offset.x * 100}%`, top: `${offset.y * 100}%`};
                    style.position = 'absolute';

                    return (
                        <this.props.pointerComponent className={`wick-custom-slider-pointer ${this.props.className}`}
                            key={index}
                            stopIndex={index}
                            onMouseDown={this.handleMouseDownPointer}
                            color={pointerItem.color}
                            pointerType={this.props.pointerType}
                            style={style} />
                    );
                })}
            </>
        );
    }
    render () {
        return (
            <div className={`wick-custom-slider ${this.props.className}`}
                style={this.props.style && this.props.style.container} >
                <div className={`wick-custom-slider-background ${this.props.className}`}
                    ref={this.container}
                    onMouseDown={this.handleMouseDownContainer}
                    style={this.props.style && this.props.style.background}>
                    {this.renderPointers()}
                </div>
            </div>
        );
    }
}

export default WickCustomSlider;