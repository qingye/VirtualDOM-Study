"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/********************************************************************************************************************************************
 * 这里的diff，实际上就是一个递归的过程：
 *
 * 1. diff根元素;
 * 2. diff根元素的props;
 * 3. diff根元素的children;
 * 4. 每个child的diff又是调用diff方法
 *
 * 更新节点（如果是移动）则需要特殊处理，减少渲染时间
 ********************************************************************************************************************************************/
function diff(srcDOM, destDOM, parent) {
  // 原dom没有，新vdom有，则表明是新增节点
  if (srcDOM === undefined) {
    parent.appendChild(createElement(destDOM));
    return false;
  } // 原dom有，新vdom没有，则表明是移除节点


  if (destDOM === undefined) {
    parent.removeChild(srcDOM);
    return false;
  } // 新老节点（类型不同 or tag不同 or 内容不同），则表明是替换节点


  if (!isEqual(destDOM, srcDOM)) {
    parent.replaceChild(createElement(destDOM), srcDOM);
    return false;
  } // 至此，只有可能是当前vdom的自身props变化 or 其children发生变化


  if (srcDOM.nodeType === Node.ELEMENT_NODE) {
    diffProps(destDOM.props, srcDOM);
    diffChildren(destDOM, srcDOM);
  }

  return true;
}

function diffProps(props, element) {
  // 合并所有props的键值（后者替换前者）
  var all = _objectSpread(_objectSpread({}, element['props']), props);

  var newProps = {}; // 遍历props的所有键值

  Object.keys(all).forEach(function (key) {
    var ov = element['props'][key];
    var nv = props[key]; // 新vdom没有该属性

    if (nv === undefined) {
      element.removeAttribute(key);
      return;
    } // 老vdom没有该属性，or 该属性值与新vdom的属性值不一致


    if (ov === undefined || ov !== nv) {
      element.setAttribute(key, nv);
    }

    newProps[key] = all[key];
  });
  element['props'] = newProps;
}

function diffChildren(vdom, element) {
  var nodes = element.childNodes || [];
  var children = vdom.children || [];
  var hasKeys = {};
  var noKeys = []; // 根据是否有key先进行分组

  nodes.forEach(function (node) {
    var props = node['props'];

    if (props && props.key !== undefined) {
      hasKeys[props.key] = node;
    } else {
      noKeys.push(node);
    }
  }); // 遍历vdom

  children.forEach(function (child, index) {
    var dom;
    var key = child.props && child.props.key !== undefined ? child.props.key : undefined;

    if (key != null && hasKeys[key]) {
      dom = hasKeys[key];
      delete hasKeys[key];
    } else {
      for (var i = 0; i < noKeys.length; i++) {
        var node = noKeys[i];

        if (isEqual(child, node)) {
          dom = node;
          noKeys.splice(i, 1);
          break;
        }
      }
    }

    var isUpdate = diff(dom, child, element);

    if (isUpdate) {
      // 更新（移动），则移到当前元素的位置，当前元素向后延一位
      var origin = nodes[index];

      if (origin !== child) {
        element.insertBefore(dom, origin);
      }
    }
  }); // 移除不在新的vdom中的节点

  var list = Object.keys(hasKeys);

  if (list.length > 0) {
    list.forEach(function (key) {
      element.removeChild(hasKeys[key]);
    });
  }

  if (noKeys.length > 0) {
    noKeys.forEach(function (node) {
      element.removeChild(node);
    });
  }
}
/********************************************************************************************************************************************
 *
 ********************************************************************************************************************************************/


function isEqual(vdom, element) {
  var elType = element.nodeType;

  var vdomType = _typeof(vdom); // 检查dom元素是文本节点的情况


  if (elType === Node.TEXT_NODE && (vdomType === 'string' || vdomType === 'number') && element.nodeValue.toString() === vdom.toString()) {
    return true;
  } // 检查dom元素是普通节点的情况


  if (elType === Node.ELEMENT_NODE && element.tagName.toLowerCase() === vdom.tag.toLowerCase()) {
    return true;
  }

  return false;
}
/********************************************************************************************************************************************
 *
 ********************************************************************************************************************************************/


var root = null; // 新增状态对象

var state = {
  list: []
};

function flatten(children) {
  return [].concat.apply([], children);
}

function v(tag, props) {
  for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    children[_key - 2] = arguments[_key];
  }

  return {
    tag: tag,
    props: props || {},
    children: flatten(children) || []
  };
}

function add(key) {
  var index = -1;

  for (var i = 0; i < state.list.length; i++) {
    var param = state.list[i];

    if (param.id === key) {
      index = i;
      break;
    }
  }

  if (index === -1) {
    state.list.push({
      id: key,
      number: 1
    });
  } else {
    state.list[index].number++;
  }

  render(root);
}

function del(key) {
  for (var i = 0; i < state.list.length; i++) {
    var param = state.list[i];

    if (param.id === key) {
      state.list.splice(i, 1);
      break;
    }
  }

  render(root);
} // 根据 state.number 来计算有多少个 div


function view() {
  var goods = [];

  for (var i = 0; i < 5; i++) {
    goods.push(v("span", {
      "class": "goods",
      onClick: "add(" + i + ")",
      key: i
    }, "\u5546\u54C1", i + 1));
  }

  var car = [];
  state.list.forEach(function (item) {
    car.push(v("li", {
      key: item.id,
      onClick: "del(" + item.id + ")"
    }, v("span", null, "\u5546\u54C1\uFF1A", item.id, "...."), v("span", null, "\u6570\u91CF\uFF1A", item.number)));
  });
  return v("div", {
    "data-list": state.list.length
  }, v("div", null, goods), v("ul", null, car));
}

function setProps(element, props) {
  for (var k in props) {
    if (props.hasOwnProperty(k)) {
      element.setAttribute(k, props[k]);
    }
  } // 保存当前的属性，之后用于新VirtualDOM的属性比较


  element['props'] = props;
}

function createElement(vdom) {
  var t = _typeof(vdom);

  if (t === 'string' || t === 'number') {
    return document.createTextNode(vdom);
  }

  var tag = vdom.tag,
      props = vdom.props,
      children = vdom.children; // 1. 创建元素

  var element = document.createElement(tag); // 2. 属性赋值

  setProps(element, props); // 3. 创建子元素
  // appendChild在执行的时候，会检查当前的this是不是dom对象，因此要bind一下

  children.map(createElement).forEach(element.appendChild.bind(element));
  return element;
}
/********************************************************************************************************************************************
 * 在 render 中:
 * 1. 首次创建 dom;
 * 2. 非首次则比较前后两次 Virtual DOM 差异，并更新
 * 3. 记录本次的 Virtual DOM
 ********************************************************************************************************************************************/


function render(container) {
  root = container;
  diff(container.firstChild ? container.firstChild : undefined, view(), container);
} // 执行render


render(document.getElementById("app"));
