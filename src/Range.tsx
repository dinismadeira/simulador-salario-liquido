import './Range.css';

type RangeProps = {
  values: any[];
  name: string;
  value: number;
  onChange: any;
  format: { (n: any): string };
}

const Range = (props: RangeProps) =>
    <span className="range">
      <input type="range"
             min="0"
             max={props.values.length - 1}
             name={props.name}
             value={props.value}
             onChange={props.onChange}/>
      <span>{props.format(props.values[props.value])}</span>
    </span>;

export default Range;
