import { ToyReact, Component } from './ToyReact.js';

const p = document.createElement('p');
for (let item of [1, 2, 3]) {
  console.log(item);
  p.appendChild(document.createTextNode(item));
  p.appendChild(document.createElement('br'));
}
document.body.appendChild(p);

// jsx test
const a = (
  <div id="div" className="div">
    <hr />
    <span>jsx test</span>
    <hr />
  </div>
);
ToyReact.render(a, document.body);

class HelloWord extends Component {
  render() {
    return <div>HelloWord, React</div>;
  }
}

class App extends Component {
  render() {
    console.log(this.children);
    return (
      <div id="react-app">
        <img
          width="60"
          src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9Ii0xMS41IC0xMC4yMzE3NCAyMyAyMC40NjM0OCI+CiAgPHRpdGxlPlJlYWN0IExvZ288L3RpdGxlPgogIDxjaXJjbGUgY3g9IjAiIGN5PSIwIiByPSIyLjA1IiBmaWxsPSIjNjFkYWZiIi8+CiAgPGcgc3Ryb2tlPSIjNjFkYWZiIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiPgogICAgPGVsbGlwc2Ugcng9IjExIiByeT0iNC4yIi8+CiAgICA8ZWxsaXBzZSByeD0iMTEiIHJ5PSI0LjIiIHRyYW5zZm9ybT0icm90YXRlKDYwKSIvPgogICAgPGVsbGlwc2Ugcng9IjExIiByeT0iNC4yIiB0cmFuc2Zvcm09InJvdGF0ZSgxMjApIi8+CiAgPC9nPgo8L3N2Zz4K"
        />
        <HelloWord></HelloWord>
        {this.children}
      </div>
    );
  }
}

ToyReact.render(
  <App>
    <p>test children</p>
    <p> boolean: {true} </p>
    <p> number: {1} </p>
    <p> regexp: {/\.jsx$/} </p>
    <p> function: {window.alert} </p>
    <p> object: {{ a: 1 }} </p>
  </App>,
  document.body
);
