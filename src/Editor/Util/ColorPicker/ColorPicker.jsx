/*
 * Copyright 2020 WICKLETS LLC
 *
 * This file is part of Wick Editor.
 *
 * Wick Editor is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Wick Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Wick Editor.  If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useState } from 'react';
import { Popover } from 'reactstrap';
import WickGradientColorPicker  from 'Editor/Util/ColorPicker/WickGradientColorPicker';

import './_colorpicker.scss';

// Check if mouseclick started on popover
const oldComponentDidMount = Popover.prototype.componentDidMount;
Popover.prototype.componentDidMount = function () {
  this.downPopover = false;
  this.handleDocumentMouseDown = (e) => {
    this.downPopover = this._popover && this._popover.contains(e.target);
  }

  oldComponentDidMount.call(this);
}
Popover.prototype.addTargetEvents = function () {
  ['click', 'touchstart'].forEach(event =>
    document.addEventListener(event, this.handleDocumentClick, true)
  );
  document.addEventListener('mousedown', this.handleDocumentMouseDown)
}

Popover.prototype.removeTargetEvents = function () {
  ['click', 'touchstart'].forEach(event =>
    document.removeEventListener(event, this.handleDocumentClick, true)
  );
  document.removeEventListener('mousedown', this.handleDocumentMouseDown)
}
Popover.prototype.handleDocumentClick = function (e) {
  if (this._target) {
    if (e.target !== this._target && !this._target.contains(e.target) && e.target !== this._popover && !(this._popover && this._popover.contains(e.target))) {
      if (this._hideTimeout) {
        this.clearHideTimeout();
      }

      if (this.props.isOpen) {
        this.toggle(e, this.downPopover);
      }
    }
  }
  this.downPopover = false;
}
Popover.prototype.toggle = function (e, data) {
  if (this.props.disabled) {
    return e && e.preventDefault();
  }

  return this.props.toggle(e, data);
}

export default function ColorPicker (props) {
  const [open, setOpen] = useState(false);

  let color = props.color ? props.color : new window.Wick.Color("#FFFFFF")
  let colorCSS = color;
  if (color instanceof window.paper.Color) {
    if (color.gradient) {
      const sortedControlStops = color.gradient.stops.toSorted((objectA, objectB) => objectA.offset - objectB.offset);

      colorCSS = 'linear-gradient(to right';
      sortedControlStops.forEach(paperControlStop => {
          colorCSS += `, ${paperControlStop.color.toCSS()} ${paperControlStop.offset * 100}%`
      });
      colorCSS += ')';
    }
    else {
      colorCSS = color.toCSS();
    }
  }
  let itemID = props.id;
  let popoverID = itemID+'-popover';

  function toggle (e, overrideClose) {
    if (!open) {
      setTimeout(selectPopover, 200);
    }

    if (!(open && overrideClose)) setOpen(!open)
  }

  function selectPopover () {
    let ele = document.getElementById(popoverID);
    if (ele) {
      ele.focus();
    }
  }

  return (
      <button
        className={"btn-color-picker"}
        aria-label="color picker button"
        id={itemID}
        onClick={toggle}
        style={props.stroke ? {borderColor: colorCSS} : color.gradient ? {backgroundImage: colorCSS} : {backgroundColor: colorCSS}}
        >
          <Popover
            tabIndex={-1}
            id={popoverID}
            placement={props.placement}
            isOpen={open}
            toggle={toggle}
            target={itemID}
            boundariesElement={'viewport'}>
            <WickGradientColorPicker
              toggle={toggle}
              colorPickerType={props.colorPickerType}
              changeColorPickerType={props.changeColorPickerType}
              disableAlpha={props.disableAlpha}
              enableGradient={props.enableGradient}
              color={color}
              onChangeComplete={props.onChangeComplete}
              onChangeIntermediate={props.onChangeIntermediate}
              lastColorsUsed={props.lastColorsUsed}
              updateLastColors={props.updateLastColors}
            />
          </Popover>
      </button>
  )
}
