const RangeSlider = props => {
  // Need to work on that to make it nice, try to overlap the sliders
  const unit = props.unit ? ` ${props.unit}` : '';
  return (
    <div className="field">
      <label className="label">{props.label}</label>
      <div className="control">
        <div className="slider-container">
          <div>
            <label>{props.values[0] + unit}</label>
          </div>
          <input
            type="range"
            name={props.names[0]}
            onChange={props.onChange}
            value={props.values[0]}
            min={props.min}
            max={props.max}
            step={props.step}
            data-inclusive={props.inclusive || null}
          />
          <input
            type="range"
            name={props.names[1]}
            onChange={props.onChange}
            value={props.values[1]}
            min={props.min}
            max={props.max}
            step={props.step}
            data-inclusive={props.inclusive || null}
          />
          <div className="has-text-right">
            <label>{props.values[1] + unit}</label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RangeSlider;
