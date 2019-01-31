# createState

This is a simple immutable state library designed to manage updates for top down libraries.

For example for webcomponents.

```js
import createState from 'createstate';

class Component extends HTMLElement {
  constructor() {
    const {state, setState, effect, memo} = createState(),
      {state: props, setState: __setProps, effect: propEffect} = createState();
    Object.assign(this, {state, setState, effect, memo, props, __setProps});

    this.attachShadow({mode: 'open'});
    renderFn = () => this.shadowRoot.innerHTML = this.render();
    effect(renderFn);
    propEffect(renderFn);
  }

  connectedCallback() { this.render(); }

  attributeChangedCallback(attr, oldVal, newVal) {
    this.__setProps({[attr]: newVal});
  }
}

class MyComponent extends Component {
  constuctor () {
    super();
    this.setState({greeting: 'World'});
  }
  render() {
    return `<div>Hello ${this.state.greeting}</div>`
  }
}
```