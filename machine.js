// machine.js by https://github.com/ajhamwood
var $ = (wm => { let v = Object.values, r = Promise.resolve.bind(Promise),
    test = (obj, con) => obj.constructor === con || con.prototype.isPrototypeOf(obj),
    add = (k, t, fn, es = wm.get(k) || {}) => { remove(k, t, fn.name); k.addEventListener(t, (es[t] = es[t] || {})[fn.name] = fn); wm.set(k, es) },
    remove = (k, t, fname, es = wm.get(k)) => { if (es && t in es && fname in es[t]) {
      k.removeEventListener(t, es[t][fname]); delete es[t][fname] && (v(es[t]).length || delete es[t]) && (v(es).length || wm.delete(k)) } };

// Enhances querySelectorAll
  return Object.assign((sel, root = document) => v(root.querySelectorAll(sel)), {

// Enhances importNode
    load (id, dest = 'body', root) {
      let stamp = document.importNode($('template#' + id)[0].content, true);
      return $(dest, root).map(n => v(stamp.cloneNode(true).childNodes).map(c => n.appendChild(c))) },

// Adds event listeners to elements and removes them by name, indexed by selector
    queries (obj, root) {
      for (let q in obj) { let ns = $(q, root); if (ns.length) for (let ts in obj[q])
        if (test(obj[q][ts], Function)) ts.split(' ').forEach(t => ns.forEach(n => add(n, t, obj[q][ts].bind(n))));
        else if (test(obj[q][ts], String)) ts.split(' ').forEach(t => ns.forEach(n => remove(n, t, 'bound ' + obj[q][ts]))) } },

// Creates state machines
    Machine: function (state) { let es = {}; Object.seal(state);
      return Object.assign(this, {
        state () { return state },
        on (t, fn) { (es[t] = es[t] || new Map()).set(fn.name, fn); return this },
        stop (t, fname = '') { t in es && es[t].delete(fname) && (es[t].size || delete es[t]); return this },
        emit (t, ...args) { return t in es && ([...es[t]].forEach(([,fn]) => fn.apply(state, args)), state) },
        emitAsync (t, ...args) { return t in es && [...es[t]].reduce((p, [,fn]) => p.then(s => r(fn.apply(s, args)).then(() => s)), r(state)) } }) },

// Recursively adds event listeners to objects and removes them by name, indexed by regex
    targets (obj, target = window) {
      for (let ts in obj) if (test(obj[ts], Function)) { if (test(target, $.Machine)) ts.split(' ').forEach(t => target.on(t, obj[ts]));
        else if (test(target, EventTarget)) ts.split(' ').forEach(t => add(target, t, obj[ts].bind(target))) }
      else if (test(obj[ts], String)) { if (test(target, $.Machine)) ts.split(' ').forEach(t => target.stop(t, obj[ts]));
        else if (test(target, EventTarget)) ts.split(' ').forEach(t => remove(target, t, 'bound ' + obj[ts])) }
      else if (ts in target) $.targets(obj[ts], target[ts]);
      else for (let k in target) if (k.match(new RegExp(`^${ts}$`))) $.targets(obj[ts], target[k]) },

// Manages async event chronology
    pipe: (ps => (p, ...ands) => ps[p] = (ps[p] || r()).then(() => Promise.all(ands.map(ors =>
      (test(ors, Array) && Promise.race(ors.map(fn => fn()))) || (test(ors, Function) && ors())))))({}) }) })(new WeakMap())
