const IMMUTABLE = Symbol('immutable')
let immutableCounter = 0;

function updatePath(current, path) {
  if (path.length === 2) {
    let value = path[1];
    if (typeof value === 'function') value = value(current[path[0]]);
    current[path[0]] = value;
    return;
  }
  const part = path.shift(),
    partType = typeof part,
    isArray = Array.isArray(current);

  if (Array.isArray(part)) {
    // Ex. update('data', [2, 23], 'label', l => l + ' !!!');
    for (let i = 0; i < part.length; i++)
      resolvePart(current, part[i], path);
  } else if (isArray && partType === 'function') {
    // Ex. update('data', i => i.id === 42, 'label', l => l + ' !!!');
    for (let i = 0; i < current.length; i++)
      if (part(current[i], i)) resolvePart(current, i, path);
  } else if (isArray && partType === 'object') {
    // Ex. update('data', { from: 3, to: 12, by: 2 }, 'label', l => l + ' !!!');
    const {from = 0, to = current.length - 1, by = 1} = part;
    for (let i = from; i <= to; i += by)
      resolvePart(current, i, path);
  } else if (isArray && part === '*') {
    // Ex. update('data', '*', 'label', l => l + ' !!!');
    for (let i = 0; i < current.length; i++)
      resolvePart(current, i, path);
  } else resolvePart(current, part, path)
}

function resolvePart(current, part, path) {
  let temp = current[part];
  if(temp !== null && typeof temp === 'object' && temp[IMMUTABLE] !== immutableCounter) {
    if (Array.isArray(temp))
      temp = temp.slice(0);
    else temp = Object.assign({}, temp);
    temp[IMMUTABLE] = immutableCounter;
    current[part] = temp;
  }
  updatePath(temp, path);
}

export default function createState(initialState = {}) {
  const memos = {},
    subs = [],
    state = Object.assign({}, initialState);

  return {
    state,
    memo(key, selector) { memos[key] = selector; },
    effect(fn) { subs.push(fn); },
    setState() {
      const length = arguments.length;
      let value = arguments[length - 1];
      immutableCounter++;
      if (length === 1) {
        if (typeof value === 'function') value = value(state);
        const keys = Object.keys(value) || [];
        for (let i = 0; i < keys.length; i += 1) {
          const key = keys[i];
          if (state[key] !== value[key]) state[key] = value[key];
        }
      } else if (Array.isArray(arguments[0])) {
        for (let i = 0; i < length; i += 1)
          updatePath(state, arguments[i]);
      } else updatePath(state, Array.prototype.slice.call(arguments));

      const keys = Object.keys(memos);
      for (let i = 0; i < keys.length; i++)
        state[keys[i]] = memos[keys[i]](state);
      for (let i = 0; i < subs.length; i++)
        subs[i](state);
    }
  }
}