const RENDER_TO_DOM = Symbol('render to dom');

const hasKey = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const isString = (s) => Object.prototype.toString.call(s) === '[object String]';
const isObject = (s) => Object.prototype.toString.call(s) === '[object Object]';

/**
 * 简单的 merge 函数
 * 但参数仅支持对象 且仅简单做了对象的深入递归
 * @param {object} target 操作目标对象
 * @param  {...object} objArr 其他对象
 */
function merge(target, ...objArr) {
  for (const obj of objArr) {
    for (const key in obj) {
      if (hasKey(obj, key)) {
        if (isObject(obj[key])) {
          if (!isObject(target[key])) {
            target[key] = {};
          }
          console.log(target[key], obj[key]);
          merge(target[key], obj[key]);
        } else {
          target[key] = obj[key];
        }
      }
    }
  }
  return target;
}
// const a = merge({ a: [1] }, { a: 1, c: [] }, { b: 2 });
// console.log(a);

function replaceContent(range, node) {
  range.insertNode(node);
  range.setStartAfter(node);
  range.deleteContents();

  range.setStartBefore(node);
  range.setEndAfter(node);
}

export class Component {
  constructor() {
    this.children = [];
    this.props = Object.create(null);
    this._root = null;
    this._range = null;
  }
  // get root() {
  //   if (!this._root) {
  //     return this.render().root;
  //   }
  //   return this._root;
  // }
  setState(state) {
    if (this.state === null && !isObject(this.state)) {
      this.state = state;
      this.renderer();
      return;
    }
    merge(this.state, state);
    this.update();
  }
  setAttribute(k, v) {
    this.props[k] = v;
  }
  appendChild(component) {
    this.children.push(component);
  }
  get vdom() {
    return this.render().vdom;
  }
  [RENDER_TO_DOM](/**@type Range */ range) {
    this._range = range;
    /* 旧的 vdom */
    this._vdom = this.vdom;
    this._vdom[RENDER_TO_DOM](range);
  }

  update() {
    // 新的
    const vdom = this.vdom;
    update(this._vdom, vdom);
    this._vdom = vdom;

    function update(oldNode, newNode) {
      // type, props, children
      // #textContent

      if (!isSameNode(oldNode, newNode)) {
        newNode[RENDER_TO_DOM](oldNode._range);
        return;
      }
      newNode._range = oldNode._range;

      const newChildren = newNode.vchildren;
      const oldChildren = oldNode.vchildren;

      if (!newChildren || !newChildren.length) {
        return;
      }

      // 记录旧的 children的range
      /**@type Range */
      let tailRange = oldChildren[oldChildren.length - 1]._range;

      for (let i = 0; i < newChildren.length; i++) {
        const newChild = newChildren[i];
        const oldChild = oldChildren[i];

        if (i < oldChildren.length) {
          update(oldChild, newChild);
        } else {
          // 如果新节点更多 则需将新节点插入
          const range = document.createRange();
          range.setStart(tailRange.endContainer, tailRange.endOffset);
          range.setEnd(tailRange.endContainer, tailRange.endOffset);
          newChild[RENDER_TO_DOM](range);
          tailRange = range;
        }
      }
    }

    /**
     * 是否相同节点
     * @param {*} oldNode
     * @param {*} newNode
     */
    function isSameNode(oldNode, newNode) {
      if (oldNode.type !== newNode.type) {
        return false;
      }

      if (newNode.type === '#text') {
        return newNode.content === oldNode.content;
      }

      if (Object.keys(newNode.props).length !== Object.keys(oldNode.props).length) {
        return false;
      }

      for (let k in newNode.props) {
        if (newNode.props[k] !== oldNode.props[k]) {
          return false;
        }
      }

      return true;
    }
  }
}

class ElementWrap extends Component {
  constructor(type) {
    super(type);
    this.type = type;
  }
  get vdom() {
    this.vchildren = this.children.map((child) => child.vdom);
    return this;
  }
  [RENDER_TO_DOM](/**@type Range */ range) {
    this._range = range;

    const root = document.createElement(this.type);

    for (let key in this.props) {
      setAttribute(key, this.props[key]);
    }

    if (!this.vchildren) {
      this.vchildren = this.children.map((child) => child.vdom);
    }
    for (let child of this.vchildren) {
      const childRange = document.createRange();
      childRange.setStart(root, root.childNodes.length);
      childRange.setEnd(root, root.childNodes.length);
      child[RENDER_TO_DOM](childRange);
    }

    replaceContent(range, root);

    function setAttribute(k, v) {
      if (k[0] === 'o' && k[1] === 'n') {
        const eventName = k.replace(/^on(\w)/, (m, g) => g.toLowerCase());
        root.addEventListener(eventName, v);
        return;
      }
      if (k === 'className') {
        root.setAttribute('class', v);
      } else {
        root.setAttribute(k, v);
      }
    }
  }
}

class TextWrap extends Component {
  constructor(textContent) {
    super(textContent);
    this.type = '#text';
    this.content = textContent;
  }
  [RENDER_TO_DOM](/**@type Range */ range) {
    this._range = range;
    const root = document.createTextNode(this.content);
    replaceContent(range, root);
  }
  get vdom() {
    return this;
  }
}

export function createElement(type, attributes, ...children) {
  const el = isString(type) ? new ElementWrap(type) : new type();

  for (let key in attributes) {
    if (hasKey(attributes, key)) {
      el.setAttribute(key, attributes[key]);
    }
  }

  const isCom = (child) => [ElementWrap, TextWrap, Component].some((p) => child instanceof p);

  const insertChildren = (children) => {
    for (let child of children) {
      if (child === null) continue;

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
}
export function render(component, /**@type HTMLElement */ parentElement) {
  const range = document.createRange();

  range.setStart(parentElement, 0);
  range.setEnd(parentElement, parentElement.childNodes.length);
  range.deleteContents();
  component[RENDER_TO_DOM](range);
}

export const ToyReact = {
  createElement,
  render
};
