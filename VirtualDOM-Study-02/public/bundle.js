"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var TYPES = {
  CREATE: 'create',
  DELETE: 'delete',
  UPDATE: 'update',
  REPLACE: 'replace'
};
/********************************************************************************************************************************************
 * 这里的diff，实际上就是一个递归的过程：
 *
 * 1. diff根元素;
 * 2. diff根元素的props;
 * 3. diff根元素的children;
 * 4. 每个child的diff又是调用diff方法
 ********************************************************************************************************************************************/

function diff(pre, post) {
  // 原vdom没有，新vdom有，则表明是新增节点
  if (pre === undefined) {
    return {
      type: TYPES.CREATE,
      vdom: post
    };
  } // 原vdom有，新vdom没有，则表明是移除节点


  if (post === undefined) {
    return {
      type: TYPES.DELETE
    };
  } // 新老节点（类型不同 or tag不同 or 内容不同），则表明是替换节点


  if (_typeof(pre) !== _typeof(post) || pre.tag !== post.tag || (typeof pre === 'string' || typeof pre === 'number') && pre !== post) {
    return {
      type: TYPES.REPLACE,
      vdom: post
    };
  } // 至此，只有可能是当前vdom的自身props变化 or 其children发生变化


  if (pre.tag) {
    var props = diffProps(pre.props, post.props);
    var children = diffChildren(pre, post);

    if (props.length > 0 || children.length > 0) {
      return {
        type: TYPES.UPDATE,
        props: props,
        children: children
      };
    }
  }
}

function diffProps(preProps, postProps) {
  var patches = []; // 合并所有props的键值（后者替换前者）

  var all = _objectSpread(_objectSpread({}, preProps), postProps); // 遍历props的所有键值


  Object.keys(all).forEach(function (key) {
    var ov = preProps[key];
    var nv = postProps[key]; // 新vdom没有该属性

    if (nv === undefined) {
      patches.push({
        pType: TYPES.DELETE,
        key: key
      });
    } // 老vdom没有该属性，or 该属性值与新vdom的属性值不一致


    if (ov === undefined || ov !== nv) {
      patches.push({
        pType: TYPES.UPDATE,
        key: key,
        value: nv
      });
    }
  });
  return patches;
}

function diffChildren(pre, post) {
  var patches = []; // 子元素最大长度

  var len = Math.max(pre.children.length, post.children.length); // 依次遍历并diff子元素

  for (var i = 0; i < len; i++) {
    var param = diff(pre.children[i], post.children[i]);

    if (param) {
      param['idx'] = i;
      patches.push(param);
    }
  }

  return patches;
}
/********************************************************************************************************************************************
 * Virtual DOM 增量更新
 ********************************************************************************************************************************************/


function patch(dif, parent) {
  var cid = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var len = parent.childNodes.length;
  var child = cid >= len ? null : parent.childNodes[cid];

  switch (dif.type) {
    case TYPES.CREATE:
      parent.appendChild(createElement(dif.vdom));
      return;

    case TYPES.DELETE:
      parent.removeChild(child);
      return;

    case TYPES.REPLACE:
      parent.replaceChild(createElement(dif.vdom), child);
      return;

    case TYPES.UPDATE:
      patchProps(child, dif.props);
      patchChildren(child, dif.children);
      break;
  }
}

function patchProps(element) {
  var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

  if (!props || props.length === 0) {
    return;
  }

  props.forEach(function (p) {
    if (p.pType === TYPES.DELETE) {
      element.removeAttribute(p.key);
    } else if (p.pType === TYPES.UPDATE) {
      element.setAttribute(p.key, p.value);
    }
  });
}

function patchChildren(element) {
  var children = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

  if (!children || children.length === 0) {
    return;
  }

  children.forEach(function (child) {
    patch(child, element, child.idx);
  });
}
/********************************************************************************************************************************************
 *
 ********************************************************************************************************************************************/


var state = {
  number: 0
};
var vdomPre;

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

function view() {
  return v("div", {
    "data-number": state.number
  }, "Hello World!", _toConsumableArray(Array(state.number).keys()).map(function (idx) {
    return v("div", {
      id: 'div' + idx,
      "data-idx": idx
    }, "-> ", idx);
  }));
}

function setProps(element, props) {
  for (var k in props) {
    if (props.hasOwnProperty(k)) {
      element.setAttribute(k, props[k]);
    }
  }
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

function render(container) {
  var vdom = view();

  if (!vdomPre) {
    container.appendChild(createElement(vdom));
  } else {
    patch(diff(vdomPre, vdom), container);
  }

  vdomPre = vdom;
  setTimeout(function () {
    state.number += 1;
    render(container);
  }, 3000);
} // 执行render


render(document.getElementById("app"));
