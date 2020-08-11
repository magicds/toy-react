const hasKey = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const isString = (s) => Object.prototype.toString.call(s) === '[object String]';

class ElementWrap {
  constructor(type) {
    this.root = document.createElement(type);
  }
  setAttribute(k, v) {
    this.root.setAttribute(k, v);
  }
  appendChild(vChild) {
    vChild.mountTo(this.root);
  }
  mountTo(parent) {
    parent.appendChild(this.root);
  }
}

class TextWrap {
  constructor(textContent) {
    this.root = document.createTextNode(textContent);
  }
  mountTo(parent) {
    parent.appendChild(this.root);
  }
}

export class Component {
  constructor() {
    this.children = [];
  }
  setAttribute(k, v) {
    this[k] = v;
  }
  appendChild(child) {
    this.children.push(child);
  }
  render() {
    return <div></div>;
  }
  mountTo(parent) {
    this.render().mountTo(parent);
  }
}

export const ToyReact = {
  createElement(type, attributes, ...children) {
    const el = isString(type) ? new ElementWrap(type) : new type();

    for (let key in attributes) {
      if (hasKey(attributes, key)) {
        el.setAttribute(key, attributes[key]);
      }
    }

    const isCom = (child) => [ElementWrap, TextWrap, Component].some((p) => child instanceof p);

    const insertChildren = (children) => {
      for (let child of children) {
        if (Array.isArray(child)) {
          // 是数组则继续
          insertChildren(child);
        } else {
          // 不是认识的组件
          if (!isCom(child)) {
            child = String(child);
          }
          if (isString(child)) {
            child = new TextWrap(child);
          }
          el.appendChild(child);
        }
      }
    };
    insertChildren(children);

    return el;
  },
  render(vdom, element) {
    vdom.mountTo(element);
  }
};
