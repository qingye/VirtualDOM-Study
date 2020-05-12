const TYPES = {
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
    }

    // 原vdom有，新vdom没有，则表明是移除节点
    if (post === undefined) {
        return {
            type: TYPES.DELETE
        };
    }

    // 新老节点（类型不同 or tag不同 or 内容不同），则表明是替换节点
    if (typeof pre !== typeof post || pre.tag !== post.tag ||
        (typeof pre === 'string' || typeof pre === 'number') && pre !== post) {
        return {
            type: TYPES.REPLACE,
            vdom: post
        };
    }

    // 至此，只有可能是当前vdom的自身props变化 or 其children发生变化
    if (pre.tag) {
        const props = diffProps(pre.props, post.props);
        const children = diffChildren(pre, post);
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
    const patches = [];

    // 合并所有props的键值（后者替换前者）
    const all = {...preProps, ...postProps};

    // 遍历props的所有键值
    Object.keys(all).forEach(key => {
        const ov = preProps[key];
        const nv = postProps[key];

        // 新vdom没有该属性
        if (nv === undefined) {
            patches.push({
                pType: TYPES.DELETE,
                key
            });
        }

        // 老vdom没有该属性，or 该属性值与新vdom的属性值不一致
        if (ov === undefined || ov !== nv) {
            patches.push({
                pType: TYPES.UPDATE,
                key,
                value: nv
            });
        }
    });

    return patches;
}

function diffChildren(pre, post) {
    const patches = [];

    // 子元素最大长度
    const len = Math.max(pre.children.length, post.children.length);

    // 依次遍历并diff子元素
    for (let i = 0; i < len; i ++) {
        const param = diff(pre.children[i], post.children[i]);
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
function patch(dif, parent, cid = 0) {
    const len = parent.childNodes.length;
    const child = cid >= len ? null : parent.childNodes[cid];
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

function patchProps(element, props = []) {
    if (!props || props.length === 0) {
        return;
    }

    props.forEach(p => {
        if (p.pType === TYPES.DELETE) {
            element.removeAttribute(p.key);
        } else if (p.pType === TYPES.UPDATE) {
            element.setAttribute(p.key, p.value);
        }
    });
}

function patchChildren(element, children = []) {
    if (!children || children.length === 0) {
        return;
    }

    children.forEach(child => {
        patch(child, element, child.idx);
    });
}

/********************************************************************************************************************************************
 *
 ********************************************************************************************************************************************/
// 新增状态对象
const state = {
    number: 0
};

// 新增上一次的Virtual DOM内容
let vdomPre;

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
    const vdom = view();
    if (!vdomPre) {
        container.appendChild(createElement(vdom));
    } else {
        patch(diff(vdomPre, vdom), container);
    }
    vdomPre = vdom;

    setTimeout(() => {
        state.number += 1;
        render(container);
    }, 3000);
}

// 执行render
render(document.getElementById("app"));