const RangeSlider = props => {
  // Need to work on that to make it nice, try to overlap the sliders
  return (
    <div className="field">
      <label className="label">{props.label}</label>
      <div className="control">
        <div className="slider-container">
          <input
            type="range"
            name={props.names[0]}
            onChange={props.onChange}
            value={props.values[0]}
            min={props.min}
            max={props.max}
            step={props.step}
          />
          <input
            type="range"
            name={props.names[1]}
            onChange={props.onChange}
            value={props.values[1]}
            min={props.min}
            max={props.max}
            step={props.step}
          />
          {/* Add labels somewhere to display the current values */}
        </div>
      </div>
    </div>
  );
};

export default RangeSlider;
