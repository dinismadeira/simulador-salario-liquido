import React from 'react';
import {BrowserRouter as Router, Link, Route, Switch} from 'react-router-dom';
import './App.css';
import Irs from './Irs';
import Range from './Range';

// Convert number to portuguese number format
function format(n: number, precision = 0) {
  return toFixed(n, precision)
  //.replace(/(?:\.(\d+))?e\+(\d+)$/, (m, m1, m2) => m1 + "000".repeat(m2))
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
      .replace(".", ",")
      .replace(/^(\d) (\d{3})\b/, "$1$2");
}

// Convert number to string with given precision
function toFixed(n: number, precision: number) {
  return precision < 0 ? round(n, precision).toFixed(0) : n.toFixed(precision);
}

// Round number with given positive or negative precision
function round(n: number, d: number) {
  return Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
}

function buildHash(state: State) {
  return Object.keys(state).map(i => encodeURIComponent(i) + "=" + encodeURIComponent(state[i])).join("&")
}

function parseHash(hash: string) {
  const map: { [i: string]: string } = {};
  const components = hash.split("&");
  for (const component of components) {
    const [key, value] = component.split("=").map(decodeURIComponent);
    map[key] = value;
  }
  return map;
}

interface State {
  [i: string]: string | number | boolean;
}

function WageLines({options}: any) {
  const wageLines: JSX.Element[] = [];
  const wage = options.wage;
  const increment = App.INCREMENTS[options.increment];
  const lines = options.lines;
  for (let i = 0, value = wage; i < lines; i++) {
    wageLines.push(<WageLine key={value} value={value} options={options}/>);
    value = Math.floor((value + increment) / increment) * increment;
  }
  return <>{wageLines}</>;
}

function WageLine({options, value}: any) {
  const precision = options.precision;

  // calculate gross wage
  const gross14Months = value;
  const gross = gross14Months * 14;
  const gross12Months = gross / 12;

  // calculate food allowance
  const saDaysPerYear = options.saDays * 11;
  const saValue = options.showSa ? options.sa : 0;
  const sa = saValue * saDaysPerYear;

  const deductibleSa = (options.saVoucher ? 7.63 : 4.77) * saDaysPerYear;
  const taxableSa = Math.max(0, sa - deductibleSa);

  // calculate taxes
  const tsu = gross * 0.2375;
  const ss = gross * 0.11;
  const irs = Irs.calc(gross + taxableSa, Math.max(ss, 4104));
  const taxSum = (options.showTsu ? tsu : 0) + ss + irs;

  // calculate total wage (gross wage + TSU + food allowance
  const total = gross + tsu + sa;
  const total14Months = total / 14;
  const total12Months = total / 12;

  // calculate net wage
  const net = gross - ss - irs;
  const net14Months = net / 14;
  const net12Months = net / 12;

  // calculate net wage plus food allowance
  const totalNet = net + sa;
  const totalNet14Months = totalNet / 14;
  const totalNet12Months = totalNet / 12;

  const wageValue = (n: number) => {
    const f = App.FORMATS[options.format];
    const value = f.base === 1 ? format(n, precision) : format(n / 1000, precision + 3);
    return value + f.unit;
  };

  const wageCell = (key: string, n: number, className = "") =>
      <td className={"WageCell " + className} key={key}
          title={format(n, 2) + " €"}>{wageValue(n)}</td>;

  return (
      <tr>{[
        options.showTaxes && options.showTsu && [
          wageCell("total", total),
          wageCell("total12Months", total12Months),
          wageCell("total14Months", total14Months, "months14")
        ],
        wageCell("gross", gross),
        wageCell("gross12Months", gross12Months),
        wageCell("gross14Months", gross14Months, "months14"),
        options.showTaxes && [
          options.showTsu && wageCell("tsu", tsu / options.taxesValue),
          wageCell("ss", ss / options.taxesValue),
          wageCell("irs", irs / options.taxesValue),
          options.showTaxSum && wageCell("taxSum", taxSum / options.taxesValue)
        ],
        wageCell("net", net),
        wageCell("net12Months", net12Months),
        wageCell("net14Months", net14Months, "months14"),
        (options.showSa && [
          wageCell("totalNet", totalNet),
          wageCell("totalNet12Months", totalNet12Months),
          wageCell("totalNet14Months", totalNet14Months, "months14")
        ])
      ]}
      </tr>
  );
}

function WageTable({options}: any) {
  return (
      <table>
        <thead>
        <tr>
          {options.showTaxes && options.showTsu &&
          <th key="total" colSpan={3} title={"Salário Bruto + TSU + SA"}>Salário Total</th>}
          <th key="gross" colSpan={3}>Salário Bruto</th>
          {options.showTaxes &&
          <th key="taxes"
              colSpan={2 + (options.showTsu ? 1 : 0) + (options.showTaxSum ? 1 : 0)}>Impostos</th>}
          <th key="net" colSpan={3}>Salário Líquido</th>
          {options.showSa && <th key="sa" colSpan={3}>+Sub. Alimentação</th>}
        </tr>
        <tr>
          {options.showTaxes && options.showTsu && [
            <th key="totalYear">Anual</th>,
            <th key="total12">/12</th>,
            <th key="total14">/14</th>
          ]}
          <th key="grossYear">Anual</th>
          <th key="gross12">/12</th>
          <th key="gross14">/14</th>
          {options.showTaxes && [
            options.showTsu && <th key="tsu">TSU</th>,
            <th key="ss">SS</th>,
            <th key="irs">IRS</th>,
            options.showTaxSum && <th key="taxSum">Total</th>
          ]}
          <th key="netYear">Anual</th>
          <th key="net12">/12</th>
          <th key="net14">/14</th>
          {options.showSa && [
            <th key="totalNetYear">Anual</th>,
            <th key="totalNet12">/12</th>,
            <th key="totalNet14">/14</th>
          ]}
        </tr>
        </thead>
        <tbody>
        <WageLines options={options}/>
        </tbody>
      </table>
  );
}

class App extends React.Component<{}, any> {

  constructor(props: {}) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.reset = this.reset.bind(this);
    this.state = App.loadState();
  }

  private static readonly DEFAULT_STATE: State = {
    wage: 705,
    lines: 30,
    increment: 5,
    showSa: true,
    saVoucher: true,
    sa: 7.63,
    saDays: 21,
    showTaxes: true,
    showTsu: false,
    showTaxSum: false,
    taxesValue: 1,
    precision: 0,
    format: 0
  };
  public static readonly INCREMENTS = [1, 5, 10, 25, 50, 100, 200, 250, 500, 1000, 10000, 100000];
  public static readonly FORMATS = [
    {base: 1, unit: " €"},
    {base: 1, unit: ""},
    {base: 3, unit: " k€"},
    {base: 3, unit: " k"},
    {base: 3, unit: "k €"},
    {base: 3, unit: "k"},
    {base: 3, unit: ""}
  ];

  private static storeState(state: State) {
    const changes: State = {};
    for (const i in state) {
      if (state.hasOwnProperty(i) && state[i] !== App.DEFAULT_STATE[i]) {
        changes[i] = state[i];
      }
    }
    window.location.hash = buildHash(changes);
    localStorage.setItem('state', JSON.stringify(changes));
  }

  private static getStateFromLocalStorage(): State {
    const savedState = localStorage.getItem('state');
    if (savedState) {
      try {
        return JSON.parse(savedState);
      } catch (e) {
        console.error(e);
      }
    }
    return {};
  }

  private static getStateFromHash(): State {
    const state: State = {};
    const hash = window.location.hash.replace(/^#/, "");
    if (hash !== "") {
      const hashState = parseHash(hash);
      for (const i in hashState) {
        if (hashState.hasOwnProperty(i) && App.DEFAULT_STATE.hasOwnProperty(i)) {
          switch (typeof (App.DEFAULT_STATE[i])) {
            case "number":
              state[i] = parseFloat(hashState[i]);
              break;
            case "boolean":
              state[i] = hashState[i] === "true";
              break;
            default:
              state[i] = hashState[i];
          }
        }
      }
    }
    return state;
  }

  private static loadState() {
    const state: State = {};
    // start with default state
    Object.assign(state, App.DEFAULT_STATE);
    // get state from hash
    const hashState = App.getStateFromHash();
    // use state from local storage if hash is empty
    const savedState = Object.keys(hashState).length === 0 ?
        App.getStateFromLocalStorage() : hashState;
    Object.assign(state, savedState);
    return state;
  }

  private handleChange(e: React.ChangeEvent<HTMLInputElement & HTMLSelectElement>) {
    this.setState((state: any) => {
      const target = e.target;
      const name = target.getAttribute("name");
      if (name != null) {
        if (typeof (state[name]) === "boolean") {
          state[name] = target.checked;
        } else if (typeof (state[name]) === "number") {
          state[name] = isNaN(parseFloat(target.value)) ? 0 : parseFloat(target.value);
          const max = target.getAttribute("max");
          if (max != null) {
            state[name] = Math.min(parseFloat(max), state[name]);
          }
        } else {
          state[name] = target.value;
        }
      }
      return state;
    });
  }

  private reset(e: React.BaseSyntheticEvent) {
    this.setState(App.DEFAULT_STATE);
    e.preventDefault();
  }

  componentDidUpdate() {
    App.storeState(this.state);
  }

  render() {
    return (
        <div className="App">
          <header className="App-header">
            <Router
                basename={"simulador-salario-liquido"}>
              <div id="title">Simulador de Salários Líquidos</div>
              <div>
                <Switch>
                  <Route path="/">
                    <form>
                      <div>
                        <b>Salário bruto /14</b>
                        <br/>
                        <label>
                          Desde:
                          <input type="number" step="100" min="0"
                                 name="wage"
                                 value={this.state.wage}
                                 onChange={this.handleChange}/>
                        </label>
                        <label>
                          Incrementos:
                          <Range name="increment"
                                 value={this.state.increment}
                                 values={App.INCREMENTS}
                                 format={(n: number) => format(n) + " €"}
                                 onChange={this.handleChange}/>
                        </label>
                        <label>
                          Linhas:
                          <input type="number" min="1" max="1000"
                                 name="lines"
                                 value={this.state.lines}
                                 onChange={this.handleChange}/>
                        </label>
                      </div>
                      <div>
                        <b>Sub. Alimentação</b>
                        <br/>
                        <label>
                          <input type="checkbox"
                                 name="showSa"
                                 checked={this.state.showSa}
                                 onChange={this.handleChange}/>
                          Incluir
                        </label>
                        <label>
                          <input type="checkbox"
                                 disabled={!this.state.showSa}
                                 name="saVoucher"
                                 checked={this.state.saVoucher}
                                 onChange={this.handleChange}/>
                          Cartão/Vales
                        </label>
                        <label>
                          Valor:
                          <input type="number" min="0" step="0.01"
                                 disabled={!this.state.showSa}
                                 name="sa"
                                 value={this.state.sa}
                                 onChange={this.handleChange}/>
                        </label>
                        <label>
                          Dias:
                          <input type="number" min="0" max="31" step="1"
                                 disabled={!this.state.showSa}
                                 name="saDays"
                                 value={this.state.saDays}
                                 onChange={this.handleChange}/>
                        </label>
                      </div>
                      <div>
                        <b>Impostos</b>
                        <br/>
                        <label>
                          <input type="checkbox"
                                 name="showTaxes"
                                 checked={this.state.showTaxes}
                                 onChange={this.handleChange}/>
                          Mostrar
                        </label>
                        <label>
                          <input type="checkbox"
                                 disabled={!this.state.showTaxes}
                                 name="showTsu"
                                 checked={this.state.showTsu}
                                 onChange={this.handleChange}/>
                          Incluir TSU
                        </label>
                        <label>
                          <input type="checkbox"
                                 disabled={!this.state.showTaxes}
                                 name="showTaxSum"
                                 checked={this.state.showTaxSum}
                                 onChange={this.handleChange}/>
                          Mostrar Total
                        </label>
                        <label>
                          Valor:
                          <select
                              disabled={!this.state.showTaxes}
                              name="taxesValue"
                              value={this.state.taxesValue}
                              onChange={this.handleChange}>
                            <option value="1">Anual</option>
                            <option value="12">/12</option>
                            <option value="14">/14</option>
                          </select>
                        </label>
                      </div>
                      <div>
                        <b>Visualização</b>
                        <br/>
                        <label>
                          Formato:
                          <select
                              name="format"
                              value={this.state.format}
                              onChange={this.handleChange}>
                            {App.FORMATS.map((f, i) =>
                                <option value={i}>{(f.base === 1 ? "1500" : "1,5") + f.unit}</option>
                            )}
                          </select>
                        </label>
                        <label>
                          Precisão:
                          <select
                              name="precision"
                              value={this.state.precision}
                              onChange={this.handleChange}>
                            {[-3, -2, -1, 0, 2].map(n =>
                                <option value={n}>{toFixed(Math.pow(10, -n), n)} €</option>)}
                          </select>
                        </label>
                        <input id="reset" type="button" onClick={this.reset} value="Reiniciar"/>
                      </div>
                    </form>
                    <WageTable options={this.state}/>
                  </Route>
                  <Route path="/about">
                    <h1>Acerca</h1>
                  </Route>
                </Switch>
              </div>
              <div id="footer">
                <Link to="/">Início</Link>
                &nbsp;-&nbsp;
                <Link to="/about">Acerca</Link>
                &nbsp;-&nbsp;
                <a href="https://github.com/dinismadeira/simulador-salario-liquido" target="_blank"
                   rel="noreferrer">GitHub</a>
              </div>
            </Router>
          </header>
        </div>
    );
  }
}

export default App;
