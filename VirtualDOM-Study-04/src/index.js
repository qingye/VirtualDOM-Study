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
    }

    // 原dom有，新vdom没有，则表明是移除节点
    if (destDOM === undefined) {
        parent.removeChild(srcDOM);
        return false;
    }

    // 新老节点（类型不同 or tag不同 or 内容不同），则表明是替换节点
    if (!isEqual(destDOM, srcDOM)) {
        parent.replaceChild(createElement(destDOM), srcDOM);
        return false;
    }

    // 至此，只有可能是当前vdom的自身props变化 or 其children发生变化
    if (srcDOM.nodeType === Node.ELEMENT_NODE) {
        diffProps(destDOM.props, srcDOM);
        diffChildren(destDOM, srcDOM);
    }
    return true;
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
    const nodes = element.childNodes || [];
    const children = vdom.children || [];

    const hasKeys = {};
    let noKeys = [];

    // 根据是否有key先进行分组
    nodes.forEach(node => {
        const props = node['props'];
        if (props && props.key !== undefined) {
            hasKeys[props.key] = node;
        } else {
            noKeys.push(node);
        }
    });

    // 遍历vdom
    children.forEach((child, index) => {
        let dom;
        const key = child.props && child.props.key !== undefined ? child.props.key : undefined;
        if (key != null && hasKeys[key]) {
            dom = hasKeys[key];
            delete hasKeys[key];
        } else {
            for (let i = 0; i < noKeys.length; i ++) {
                const node = noKeys[i];
                if (isEqual(child, node)) {
                    dom = node;
                    noKeys.splice(i, 1);
                    break;
                }
            }
        }

        const isUpdate = diff(dom, child, element);
        if (isUpdate) {
            // 更新（移动），则移到当前元素的位置，当前元素向后延一位
            const origin = nodes[index];
            if (origin !== child) {
                element.insertBefore(dom, origin);
            }
        }
    });

    // 移除不在新的vdom中的节点
    const list = Object.keys(hasKeys);
    if (list.length > 0) {
        list.forEach(key => {
            element.removeChild(hasKeys[key]);
        });
    }
    if (noKeys.length > 0) {
        noKeys.forEach(node => {
            element.removeChild(node);
        });
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
        element.nodeValue.toString() === vdom.toString()) {
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
let root = null;

// 新增状态对象
const state = {
    list: []
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

function add(key) {
    let index = -1;
    for (let i = 0; i < state.list.length; i ++) {
        const param = state.list[i];
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
        state.list[index].number ++;
    }
    render(root);
}

function del(key) {
    for (let i = 0; i < state.list.length; i ++) {
        const param = state.list[i];
        if (param.id === key) {
            state.list.splice(i, 1);
            break;
        }
    }
    render(root);
}

// 根据 state.number 来计算有多少个 div
function view() {
    const goods = [];
    for (let i = 0; i < 5; i ++) {
        goods.push(
            <span class="goods" onClick={"add(" + i + ")"} key={i}>商品{i+1}</span>
        )
    }

    const car = [];
    state.list.forEach(item => {
        car.push(
            <li key={item.id} onClick={"del(" + item.id + ")"}>
                <span>商品：{item.id}....</span>
                <span>数量：{item.number}</span>
            </li>
        )
    });

    return (
        <div data-list={state.list.length}>
            <div>{goods}</div>
            <ul>{car}</ul>
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
    root = container;
    diff(container.firstChild ? container.firstChild : undefined, view(), container);
}

// 执行render
render(document.getElementById("app"));