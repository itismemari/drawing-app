import React from 'react';
import './rangeSlider.scss'

const RangeSlider = (props : any) => {
  const percentage = 100 * (props.value - props.min) / (props.max - props.min)
  const rangerStyle = {
     background: `linear-gradient(90deg, var( - primary-600) 0, var( - orange-500) ${percentage}%, ${props.secondaryBgColor ? props.secondaryBgColor : 'var( - defaut-color)'} ${percentage + 0.1}%)`
   }

return (
 <input className={`range-slider-input w-full ${props.customClasses ? props.customClasses : ''}`} style={rangerStyle} type='range' value={props.value} min={props.min} max={props.max} onChange={props.onChange} disabled={props.disabled} />
 )

}

export default RangeSlider