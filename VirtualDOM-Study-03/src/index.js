/********************************************************************************************************************************************
 * 这里的diff，实际上就是一个递归的过程：
 *
 * 1. diff根元素;
 * 2. diff根元素的props;
 * 3. diff根元素的children;
 * 4. 每个child的diff又是调用diff方法
 ********************************************************************************************************************************************/
function diff(vdom, parent, cid = 0) {
    const len = parent.childNodes.length;

    // child是当前真实dom！
    const child = cid >= len ? undefined : parent.childNodes[cid];

    // 原dom没有，新vdom有，则表明是新增节点
    if (child === undefined) {
        parent.appendChild(createElement(vdom));
        return;
    }

    // 原dom有，新vdom没有，则表明是移除节点
    if (vdom === undefined) {
        parent.removeChild(child);
        return
    }

    // 新老节点（类型不同 or tag不同 or 内容不同），则表明是替换节点
    if (!isEqual(vdom, child)) {
        parent.replaceChild(createElement(vdom), child);
        return;
    }

    // 至此，只有可能是当前vdom的自身props变化 or 其children发生变化
    if (child.nodeType === Node.ELEMENT_NODE) {
        diffProps(vdom.props, child);
        diffChildren(vdom, child);
    }
}

function diffProps(props, element) {
    // 合并所有props的键值（后者替换前者）
    const all = {...element['props'], ...props};
    const newProps = {};

    // 遍历props的所有键值
    Object.keys(all).forEach(key => {
        const ov = element['props'][key];
        const nv = props[key];

        // 新vdom没有该属性
        if (nv === undefined) {
            element.removeAttribute(key);
            return;
        }

        // 老vdom没有该属性，or 该属性值与新vdom的属性值不一致
        if (ov === undefined || ov !== nv) {
            element.setAttribute(key, nv);
        }
        newProps[key] = all[key];
    });
    element['props'] = newProps;
}

function diffChildren(vdom, element) {
    // 子元素最大长度
    const len = Math.max(element.childNodes.length, vdom.children.length);

    // 依次遍历并diff子元素
    for (let i = 0; i < len; i ++) {
        diff(vdom.children[i], element, i);
    }
}

/********************************************************************************************************************************************
 *
 ********************************************************************************************************************************************/
function isEqual(vdom, element) {
    const elType = element.nodeType;
    const vdomType = typeof vdom;

    // 检查dom元素是文本节点的情况
    if (elType === Node.TEXT_NODE &&
        (vdomType === 'string' || vdomType === 'number') &&
        element.nodeValue === vdom) {
        return true;
    }

    // 检查dom元素是普通节点的情况
    if (elType === Node.ELEMENT_NODE && element.tagName.toLowerCase() === vdom.tag.toLowerCase()) {
        return true;
    }

    return false;
}

/********************************************************************************************************************************************
 *
 ********************************************************************************************************************************************/
// 新增状态对象
const state = {
    number: 0
};

function flatten(children) {
    return [].concat.apply([], children);
}

function v(tag, props, ...children) {
    return {
        tag,
        props: props || {},
        children: flatten(children) || []
    }
}

// 根据 state.number 来计算有多少个 div
function view() {
    return (
        <div data-number={state.number}>
            Hello World!
            {
                [...Array(state.number).keys()].map(idx => (
                    <div id={'div' + idx} data-idx={idx}>-> {idx}</div>
                ))
            }
        </div>
    );
}

function setProps(element, props) {
    for (let k in props) {
        if (props.hasOwnProperty(k)) {
            element.setAttribute(k, props[k]);
        }
    }

    // 保存当前的属性，之后用于新VirtualDOM的属性比较
    element['props'] = props;
}

function createElement(vdom) {
    const t = typeof vdom;
    if (t === 'string' || t === 'number') {
        return document.createTextNode(vdom);
    }

    const {tag, props, children} = vdom;

    // 1. 创建元素
    const element = document.createElement(tag);

    // 2. 属性赋值
    setProps(element, props);

    // 3. 创建子元素
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
    diff(view(), container);

    setTimeout(() => {
        state.number += 1;
        render(container);
    }, 3000);
}

// 执行render
render(document.getElementById("app"));