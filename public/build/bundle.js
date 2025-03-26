
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\Sidebar.svelte generated by Svelte v3.59.2 */

    const file$4 = "src\\components\\Sidebar.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	child_ctx[12] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    // (151:4) {#if imageMap[list]}
    function create_if_block$3(ctx) {
    	let each_1_anchor;
    	let each_value_1 = /*imageMap*/ ctx[2][/*list*/ ctx[10]];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*imageMap, userLists*/ 6) {
    				each_value_1 = /*imageMap*/ ctx[2][/*list*/ ctx[10]];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(151:4) {#if imageMap[list]}",
    		ctx
    	});

    	return block;
    }

    // (152:6) {#each imageMap[list] as image}
    function create_each_block_1$1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*image*/ ctx[13])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "" + (/*list*/ ctx[10] + " image"));
    			attr_dev(img, "class", "icon svelte-l2xali");
    			add_location(img, file$4, 152, 8, 3572);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(152:6) {#each imageMap[list] as image}",
    		ctx
    	});

    	return block;
    }

    // (141:2) {#each userLists as list, i}
    function create_each_block$1(ctx) {
    	let div;
    	let t0;
    	let span;
    	let t1_value = /*list*/ ctx[10] + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;
    	let if_block = /*imageMap*/ ctx[2][/*list*/ ctx[10]] && create_if_block$3(ctx);

    	function click_handler_5() {
    		return /*click_handler_5*/ ctx[8](/*i*/ ctx[12]);
    	}

    	function keydown_handler(...args) {
    		return /*keydown_handler*/ ctx[9](/*i*/ ctx[12], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			add_location(span, file$4, 155, 4, 3655);
    			attr_dev(div, "class", "user-list svelte-l2xali");
    			attr_dev(div, "tabindex", "0");
    			attr_dev(div, "role", "button");
    			toggle_class(div, "active", /*activeMenuItem*/ ctx[0] === `userList${/*i*/ ctx[12]}`);
    			add_location(div, file$4, 141, 2, 3180);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, span);
    			append_dev(span, t1);
    			append_dev(div, t2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "click", click_handler_5, false, false, false, false),
    					listen_dev(div, "keydown", keydown_handler, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (/*imageMap*/ ctx[2][/*list*/ ctx[10]]) if_block.p(ctx, dirty);

    			if (dirty & /*activeMenuItem*/ 1) {
    				toggle_class(div, "active", /*activeMenuItem*/ ctx[0] === `userList${/*i*/ ctx[12]}`);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(141:2) {#each userLists as list, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div10;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div3;
    	let div1;
    	let i0;
    	let t1;
    	let span0;
    	let t3;
    	let div2;
    	let i1;
    	let t4;
    	let span1;
    	let t6;
    	let div9;
    	let div4;
    	let span2;
    	let t8;
    	let div5;
    	let i2;
    	let t9;
    	let span3;
    	let t11;
    	let div6;
    	let i3;
    	let t12;
    	let span4;
    	let t14;
    	let div7;
    	let i4;
    	let t15;
    	let span5;
    	let t17;
    	let div8;
    	let t18;
    	let t19;
    	let link;
    	let mounted;
    	let dispose;
    	let each_value = /*userLists*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div3 = element("div");
    			div1 = element("div");
    			i0 = element("i");
    			t1 = space();
    			span0 = element("span");
    			span0.textContent = "Нүүр";
    			t3 = space();
    			div2 = element("div");
    			i1 = element("i");
    			t4 = space();
    			span1 = element("span");
    			span1.textContent = "Хайх";
    			t6 = space();
    			div9 = element("div");
    			div4 = element("div");
    			span2 = element("span");
    			span2.textContent = "Миний сан";
    			t8 = space();
    			div5 = element("div");
    			i2 = element("i");
    			t9 = space();
    			span3 = element("span");
    			span3.textContent = "Сүүлд сонссон";
    			t11 = space();
    			div6 = element("div");
    			i3 = element("i");
    			t12 = space();
    			span4 = element("span");
    			span4.textContent = "Дуртай";
    			t14 = space();
    			div7 = element("div");
    			i4 = element("i");
    			t15 = space();
    			span5 = element("span");
    			span5.textContent = "Микс үүсгэх";
    			t17 = space();
    			div8 = element("div");
    			t18 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t19 = space();
    			link = element("link");
    			if (!src_url_equal(img.src, img_src_value = "./images/logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Logo");
    			attr_dev(img, "class", "svelte-l2xali");
    			add_location(img, file$4, 103, 4, 1837);
    			attr_dev(div0, "class", "logo svelte-l2xali");
    			add_location(div0, file$4, 102, 2, 1813);
    			attr_dev(i0, "class", "fas fa-home icon svelte-l2xali");
    			add_location(i0, file$4, 109, 6, 2056);
    			add_location(span0, file$4, 110, 6, 2096);
    			attr_dev(div1, "class", "menu-item svelte-l2xali");
    			toggle_class(div1, "active", /*activeMenuItem*/ ctx[0] === 'home');
    			add_location(div1, file$4, 108, 4, 1941);
    			attr_dev(i1, "class", "fas fa-search icon svelte-l2xali");
    			add_location(i1, file$4, 113, 6, 2250);
    			add_location(span1, file$4, 114, 6, 2292);
    			attr_dev(div2, "class", "menu-item svelte-l2xali");
    			toggle_class(div2, "active", /*activeMenuItem*/ ctx[0] === 'search');
    			add_location(div2, file$4, 112, 4, 2131);
    			attr_dev(div3, "class", "menu svelte-l2xali");
    			add_location(div3, file$4, 107, 2, 1917);
    			add_location(span2, file$4, 122, 6, 2419);
    			attr_dev(div4, "class", "text svelte-l2xali");
    			add_location(div4, file$4, 121, 4, 2393);
    			attr_dev(i2, "class", "fas fa-music icon svelte-l2xali");
    			add_location(i2, file$4, 126, 6, 2586);
    			add_location(span3, file$4, 127, 6, 2627);
    			attr_dev(div5, "class", "bottom-item svelte-l2xali");
    			toggle_class(div5, "active", /*activeMenuItem*/ ctx[0] === 'recent');
    			add_location(div5, file$4, 125, 4, 2465);
    			attr_dev(i3, "class", "fas fa-heart icon svelte-l2xali");
    			add_location(i3, file$4, 130, 6, 2798);
    			add_location(span4, file$4, 131, 6, 2839);
    			attr_dev(div6, "class", "bottom-item svelte-l2xali");
    			toggle_class(div6, "active", /*activeMenuItem*/ ctx[0] === 'favorites');
    			add_location(div6, file$4, 129, 4, 2671);
    			attr_dev(i4, "class", "fas fa-plus icon svelte-l2xali");
    			add_location(i4, file$4, 134, 6, 3003);
    			add_location(span5, file$4, 135, 6, 3043);
    			attr_dev(div7, "class", "bottom-item svelte-l2xali");
    			toggle_class(div7, "active", /*activeMenuItem*/ ctx[0] === 'createMix');
    			add_location(div7, file$4, 133, 4, 2876);
    			attr_dev(div8, "class", "line svelte-l2xali");
    			add_location(div8, file$4, 137, 4, 3085);
    			attr_dev(div9, "class", "bottom svelte-l2xali");
    			add_location(div9, file$4, 119, 2, 2361);
    			attr_dev(div10, "class", "sidebar svelte-l2xali");
    			add_location(div10, file$4, 100, 0, 1771);
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css");
    			add_location(link, file$4, 163, 2, 3736);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div0);
    			append_dev(div0, img);
    			append_dev(div10, t0);
    			append_dev(div10, div3);
    			append_dev(div3, div1);
    			append_dev(div1, i0);
    			append_dev(div1, t1);
    			append_dev(div1, span0);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, i1);
    			append_dev(div2, t4);
    			append_dev(div2, span1);
    			append_dev(div10, t6);
    			append_dev(div10, div9);
    			append_dev(div9, div4);
    			append_dev(div4, span2);
    			append_dev(div9, t8);
    			append_dev(div9, div5);
    			append_dev(div5, i2);
    			append_dev(div5, t9);
    			append_dev(div5, span3);
    			append_dev(div9, t11);
    			append_dev(div9, div6);
    			append_dev(div6, i3);
    			append_dev(div6, t12);
    			append_dev(div6, span4);
    			append_dev(div9, t14);
    			append_dev(div9, div7);
    			append_dev(div7, i4);
    			append_dev(div7, t15);
    			append_dev(div7, span5);
    			append_dev(div9, t17);
    			append_dev(div9, div8);
    			append_dev(div9, t18);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div9, null);
    				}
    			}

    			insert_dev(target, t19, anchor);
    			append_dev(document.head, link);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "click", /*click_handler*/ ctx[3], false, false, false, false),
    					listen_dev(div2, "click", /*click_handler_1*/ ctx[4], false, false, false, false),
    					listen_dev(div5, "click", /*click_handler_2*/ ctx[5], false, false, false, false),
    					listen_dev(div6, "click", /*click_handler_3*/ ctx[6], false, false, false, false),
    					listen_dev(div7, "click", /*click_handler_4*/ ctx[7], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*activeMenuItem*/ 1) {
    				toggle_class(div1, "active", /*activeMenuItem*/ ctx[0] === 'home');
    			}

    			if (dirty & /*activeMenuItem*/ 1) {
    				toggle_class(div2, "active", /*activeMenuItem*/ ctx[0] === 'search');
    			}

    			if (dirty & /*activeMenuItem*/ 1) {
    				toggle_class(div5, "active", /*activeMenuItem*/ ctx[0] === 'recent');
    			}

    			if (dirty & /*activeMenuItem*/ 1) {
    				toggle_class(div6, "active", /*activeMenuItem*/ ctx[0] === 'favorites');
    			}

    			if (dirty & /*activeMenuItem*/ 1) {
    				toggle_class(div7, "active", /*activeMenuItem*/ ctx[0] === 'createMix');
    			}

    			if (dirty & /*activeMenuItem, userLists, imageMap*/ 7) {
    				each_value = /*userLists*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div9, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t19);
    			detach_dev(link);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Sidebar', slots, []);
    	let userLists = ['Муугүй лист', 'Гоё дуунууд'];
    	let activeMenuItem = '';

    	let imageMap = {
    		'Муугүй лист': ['./images/list1.jpg'],
    		'Гоё дуунууд': ['./images/list2.jpg']
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, activeMenuItem = 'home');
    	const click_handler_1 = () => $$invalidate(0, activeMenuItem = 'search');
    	const click_handler_2 = () => $$invalidate(0, activeMenuItem = 'recent');
    	const click_handler_3 = () => $$invalidate(0, activeMenuItem = 'favorites');
    	const click_handler_4 = () => $$invalidate(0, activeMenuItem = 'createMix');
    	const click_handler_5 = i => $$invalidate(0, activeMenuItem = `userList${i}`);
    	const keydown_handler = (i, e) => e.key === 'Enter' && $$invalidate(0, activeMenuItem = `userList${i}`);
    	$$self.$capture_state = () => ({ userLists, activeMenuItem, imageMap });

    	$$self.$inject_state = $$props => {
    		if ('userLists' in $$props) $$invalidate(1, userLists = $$props.userLists);
    		if ('activeMenuItem' in $$props) $$invalidate(0, activeMenuItem = $$props.activeMenuItem);
    		if ('imageMap' in $$props) $$invalidate(2, imageMap = $$props.imageMap);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		activeMenuItem,
    		userLists,
    		imageMap,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		keydown_handler
    	];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    // src/stores.js

    const currentMusic = writable(null);

    /* src\components\MusicPlayer.svelte generated by Svelte v3.59.2 */
    const file$3 = "src\\components\\MusicPlayer.svelte";

    // (68:0) {#if $currentMusic}
    function create_if_block$2(ctx) {
    	let div9;
    	let div3;
    	let img;
    	let img_src_value;
    	let t0;
    	let div2;
    	let div0;
    	let t2;
    	let div1;
    	let t4;
    	let button0;
    	let svg0;
    	let path0;
    	let svg0_fill_value;
    	let svg0_stroke_value;
    	let t5;
    	let button1;
    	let svg1;
    	let circle0;
    	let line0;
    	let line1;
    	let t6;
    	let div5;
    	let button2;
    	let svg2;
    	let path1;
    	let t7;
    	let button3;
    	let t8;
    	let button4;
    	let svg3;
    	let path2;
    	let t9;
    	let t10_value = formatTime(/*currentTime*/ ctx[2]) + "";
    	let t10;
    	let t11;
    	let div4;
    	let input0;
    	let input0_max_value;
    	let input0_value_value;
    	let t12;
    	let t13_value = formatTime(/*duration*/ ctx[3] || 0) + "";
    	let t13;
    	let t14;
    	let button5;
    	let svg4;
    	let path3;
    	let path4;
    	let path5;
    	let path6;
    	let t15;
    	let svg5;
    	let path7;
    	let t16;
    	let div7;
    	let t17;
    	let svg6;
    	let polygon;
    	let path8;
    	let t18;
    	let div6;
    	let input1;
    	let t19;
    	let svg7;
    	let circle1;
    	let circle2;
    	let path9;
    	let t20;
    	let div8;
    	let button6;
    	let t21;
    	let button7;
    	let svg8;
    	let path10;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*$currentMusic*/ ctx[1].isPlaying) return create_if_block_2$1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*$currentMusic*/ ctx[1].isPlaying) return create_if_block_1$1;
    		return create_else_block$1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div3 = element("div");
    			img = element("img");
    			t0 = space();
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = `${'Mmusic'}`;
    			t2 = space();
    			div1 = element("div");
    			div1.textContent = `${'Таны сонсож буй дуу'}`;
    			t4 = space();
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t5 = space();
    			button1 = element("button");
    			svg1 = svg_element("svg");
    			circle0 = svg_element("circle");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			t6 = space();
    			div5 = element("div");
    			button2 = element("button");
    			svg2 = svg_element("svg");
    			path1 = svg_element("path");
    			t7 = space();
    			button3 = element("button");
    			if_block0.c();
    			t8 = space();
    			button4 = element("button");
    			svg3 = svg_element("svg");
    			path2 = svg_element("path");
    			t9 = space();
    			t10 = text(t10_value);
    			t11 = space();
    			div4 = element("div");
    			input0 = element("input");
    			t12 = space();
    			t13 = text(t13_value);
    			t14 = space();
    			button5 = element("button");
    			svg4 = svg_element("svg");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			t15 = space();
    			svg5 = svg_element("svg");
    			path7 = svg_element("path");
    			t16 = space();
    			div7 = element("div");
    			t17 = text("Д.үг\r\n      ");
    			svg6 = svg_element("svg");
    			polygon = svg_element("polygon");
    			path8 = svg_element("path");
    			t18 = space();
    			div6 = element("div");
    			input1 = element("input");
    			t19 = space();
    			svg7 = svg_element("svg");
    			circle1 = svg_element("circle");
    			circle2 = svg_element("circle");
    			path9 = svg_element("path");
    			t20 = space();
    			div8 = element("div");
    			button6 = element("button");
    			if_block1.c();
    			t21 = space();
    			button7 = element("button");
    			svg8 = svg_element("svg");
    			path10 = svg_element("path");
    			if (!src_url_equal(img.src, img_src_value = /*$currentMusic*/ ctx[1].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Artist");
    			attr_dev(img, "class", "thumbnail svelte-xltfe9");
    			add_location(img, file$3, 70, 6, 1506);
    			attr_dev(div0, "class", "name svelte-xltfe9");
    			add_location(div0, file$3, 72, 8, 1593);
    			attr_dev(div1, "class", "artist svelte-xltfe9");
    			add_location(div1, file$3, 73, 8, 1637);
    			add_location(div2, file$3, 71, 6, 1578);
    			attr_dev(path0, "d", "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z");
    			add_location(path0, file$3, 77, 10, 2014);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "width", "24");
    			attr_dev(svg0, "height", "24");
    			attr_dev(svg0, "fill", svg0_fill_value = /*$currentMusic*/ ctx[1].liked ? "#DC2626" : "none");
    			attr_dev(svg0, "stroke", svg0_stroke_value = /*$currentMusic*/ ctx[1].liked ? "#DC2626" : "#9CA3AF");
    			attr_dev(svg0, "stroke-width", "2");
    			attr_dev(svg0, "stroke-linecap", "round");
    			attr_dev(svg0, "stroke-linejoin", "round");
    			add_location(svg0, file$3, 76, 8, 1774);
    			attr_dev(button0, "class", "heart hide-mobile svelte-xltfe9");
    			add_location(button0, file$3, 75, 6, 1708);
    			attr_dev(circle0, "cx", "12");
    			attr_dev(circle0, "cy", "12");
    			attr_dev(circle0, "r", "10");
    			add_location(circle0, file$3, 82, 10, 2413);
    			attr_dev(line0, "x1", "8");
    			attr_dev(line0, "y1", "15");
    			attr_dev(line0, "x2", "16");
    			attr_dev(line0, "y2", "15");
    			add_location(line0, file$3, 83, 10, 2465);
    			attr_dev(line1, "x1", "8");
    			attr_dev(line1, "y1", "9");
    			attr_dev(line1, "x2", "16");
    			attr_dev(line1, "y2", "9");
    			add_location(line1, file$3, 84, 10, 2521);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "width", "24");
    			attr_dev(svg1, "height", "24");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "stroke", "#9CA3AF");
    			attr_dev(svg1, "stroke-width", "2");
    			attr_dev(svg1, "stroke-linecap", "round");
    			attr_dev(svg1, "stroke-linejoin", "round");
    			add_location(svg1, file$3, 81, 8, 2245);
    			attr_dev(button1, "class", "mix hide-mobile svelte-xltfe9");
    			add_location(button1, file$3, 80, 6, 2203);
    			attr_dev(div3, "class", "left svelte-xltfe9");
    			add_location(div3, file$3, 69, 4, 1480);
    			attr_dev(path1, "d", "M11 19l-9-7 9-7v14zm11 0l-9-7 9-7v14z");
    			add_location(path1, file$3, 91, 10, 2884);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "width", "24");
    			attr_dev(svg2, "height", "24");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "stroke", "currentColor");
    			attr_dev(svg2, "stroke-width", "2");
    			attr_dev(svg2, "stroke-linecap", "round");
    			attr_dev(svg2, "stroke-linejoin", "round");
    			add_location(svg2, file$3, 90, 8, 2711);
    			attr_dev(button2, "class", "control svelte-xltfe9");
    			add_location(button2, file$3, 89, 6, 2654);
    			attr_dev(button3, "class", "control play svelte-xltfe9");
    			add_location(button3, file$3, 94, 6, 2974);
    			attr_dev(path2, "d", "M13 19l9-7-9-7v14zm-11 0l9-7-9-7v14z");
    			add_location(path2, file$3, 108, 10, 3890);
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg3, "width", "24");
    			attr_dev(svg3, "height", "24");
    			attr_dev(svg3, "fill", "none");
    			attr_dev(svg3, "stroke", "currentColor");
    			attr_dev(svg3, "stroke-width", "2");
    			attr_dev(svg3, "stroke-linecap", "round");
    			attr_dev(svg3, "stroke-linejoin", "round");
    			add_location(svg3, file$3, 107, 8, 3717);
    			attr_dev(button4, "class", "control svelte-xltfe9");
    			add_location(button4, file$3, 106, 6, 3662);
    			attr_dev(input0, "type", "range");
    			attr_dev(input0, "min", "0");
    			attr_dev(input0, "max", input0_max_value = /*duration*/ ctx[3] || 0);
    			input0.value = input0_value_value = /*currentTime*/ ctx[2] || 0;
    			attr_dev(input0, "step", "0.1");
    			attr_dev(input0, "class", "svelte-xltfe9");
    			add_location(input0, file$3, 113, 8, 4048);
    			attr_dev(div4, "class", "progress-bar svelte-xltfe9");
    			add_location(div4, file$3, 112, 6, 4012);
    			attr_dev(path3, "d", "M17 1l4 4-4 4");
    			add_location(path3, file$3, 125, 10, 4525);
    			attr_dev(path4, "d", "M3 11V9a4 4 0 014-4h14");
    			add_location(path4, file$3, 126, 10, 4562);
    			attr_dev(path5, "d", "M7 23l-4-4 4-4");
    			add_location(path5, file$3, 127, 10, 4608);
    			attr_dev(path6, "d", "M21 13v2a4 4 0 01-4 4H3");
    			add_location(path6, file$3, 128, 10, 4646);
    			attr_dev(svg4, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg4, "width", "24");
    			attr_dev(svg4, "height", "24");
    			attr_dev(svg4, "fill", "none");
    			attr_dev(svg4, "stroke", "#9CA3AF");
    			attr_dev(svg4, "stroke-width", "2");
    			attr_dev(svg4, "stroke-linecap", "round");
    			attr_dev(svg4, "stroke-linejoin", "round");
    			add_location(svg4, file$3, 124, 8, 4357);
    			attr_dev(button5, "class", "control svelte-xltfe9");
    			add_location(button5, file$3, 123, 6, 4323);
    			attr_dev(path7, "d", "M16 3h5v5M4 20L20.2 3.8M21 16v5h-5M15 15l5.1 5.1M4 4l5 5");
    			add_location(path7, file$3, 131, 182, 4902);
    			attr_dev(svg5, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg5, "width", "24");
    			attr_dev(svg5, "height", "24");
    			attr_dev(svg5, "viewBox", "0 0 24 24");
    			attr_dev(svg5, "fill", "none");
    			attr_dev(svg5, "stroke", "#9CA3AF");
    			attr_dev(svg5, "stroke-width", "2");
    			attr_dev(svg5, "stroke-linecap", "round");
    			attr_dev(svg5, "stroke-linejoin", "round");
    			add_location(svg5, file$3, 131, 6, 4726);
    			attr_dev(div5, "class", "center hide-mobile svelte-xltfe9");
    			add_location(div5, file$3, 88, 4, 2614);
    			attr_dev(polygon, "points", "11 5 6 9 2 9 2 15 6 15 11 19 11 5");
    			add_location(polygon, file$3, 135, 182, 5221);
    			attr_dev(path8, "d", "M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07");
    			add_location(path8, file$3, 135, 244, 5283);
    			attr_dev(svg6, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg6, "width", "24");
    			attr_dev(svg6, "height", "24");
    			attr_dev(svg6, "viewBox", "0 0 24 24");
    			attr_dev(svg6, "fill", "none");
    			attr_dev(svg6, "stroke", "#D4D4D8");
    			attr_dev(svg6, "stroke-width", "2");
    			attr_dev(svg6, "stroke-linecap", "round");
    			attr_dev(svg6, "stroke-linejoin", "round");
    			add_location(svg6, file$3, 135, 6, 5045);
    			attr_dev(input1, "type", "range");
    			attr_dev(input1, "min", "0");
    			attr_dev(input1, "max", "100");
    			input1.value = "50";
    			attr_dev(input1, "class", "svelte-xltfe9");
    			add_location(input1, file$3, 137, 8, 5404);
    			attr_dev(div6, "class", "volume svelte-xltfe9");
    			add_location(div6, file$3, 136, 6, 5374);
    			attr_dev(circle1, "cx", "5.5");
    			attr_dev(circle1, "cy", "17.5");
    			attr_dev(circle1, "r", "2.5");
    			add_location(circle1, file$3, 139, 182, 5653);
    			attr_dev(circle2, "cx", "17.5");
    			attr_dev(circle2, "cy", "15.5");
    			attr_dev(circle2, "r", "2.5");
    			add_location(circle2, file$3, 139, 218, 5689);
    			attr_dev(path9, "d", "M8 17V5l12-2v12");
    			add_location(path9, file$3, 139, 255, 5726);
    			attr_dev(svg7, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg7, "width", "24");
    			attr_dev(svg7, "height", "24");
    			attr_dev(svg7, "viewBox", "0 0 24 24");
    			attr_dev(svg7, "fill", "none");
    			attr_dev(svg7, "stroke", "#D4D4D8");
    			attr_dev(svg7, "stroke-width", "2");
    			attr_dev(svg7, "stroke-linecap", "round");
    			attr_dev(svg7, "stroke-linejoin", "round");
    			add_location(svg7, file$3, 139, 6, 5477);
    			attr_dev(div7, "class", "right hide-mobile svelte-xltfe9");
    			add_location(div7, file$3, 133, 4, 4994);
    			attr_dev(button6, "class", "control play svelte-xltfe9");
    			add_location(button6, file$3, 143, 6, 5816);
    			attr_dev(path10, "d", "M13 19l9-7-9-7v14zm-11 0l9-7-9-7v14z");
    			add_location(path10, file$3, 157, 10, 6732);
    			attr_dev(svg8, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg8, "width", "24");
    			attr_dev(svg8, "height", "24");
    			attr_dev(svg8, "fill", "none");
    			attr_dev(svg8, "stroke", "currentColor");
    			attr_dev(svg8, "stroke-width", "2");
    			attr_dev(svg8, "stroke-linecap", "round");
    			attr_dev(svg8, "stroke-linejoin", "round");
    			add_location(svg8, file$3, 156, 8, 6559);
    			attr_dev(button7, "class", "control svelte-xltfe9");
    			add_location(button7, file$3, 155, 6, 6504);
    			attr_dev(div8, "class", "mobile-controls svelte-xltfe9");
    			add_location(div8, file$3, 142, 4, 5779);
    			attr_dev(div9, "class", "music-player svelte-xltfe9");
    			add_location(div9, file$3, 68, 2, 1448);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div3);
    			append_dev(div3, img);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div3, t4);
    			append_dev(div3, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div3, t5);
    			append_dev(div3, button1);
    			append_dev(button1, svg1);
    			append_dev(svg1, circle0);
    			append_dev(svg1, line0);
    			append_dev(svg1, line1);
    			append_dev(div9, t6);
    			append_dev(div9, div5);
    			append_dev(div5, button2);
    			append_dev(button2, svg2);
    			append_dev(svg2, path1);
    			append_dev(div5, t7);
    			append_dev(div5, button3);
    			if_block0.m(button3, null);
    			append_dev(div5, t8);
    			append_dev(div5, button4);
    			append_dev(button4, svg3);
    			append_dev(svg3, path2);
    			append_dev(div5, t9);
    			append_dev(div5, t10);
    			append_dev(div5, t11);
    			append_dev(div5, div4);
    			append_dev(div4, input0);
    			append_dev(div5, t12);
    			append_dev(div5, t13);
    			append_dev(div5, t14);
    			append_dev(div5, button5);
    			append_dev(button5, svg4);
    			append_dev(svg4, path3);
    			append_dev(svg4, path4);
    			append_dev(svg4, path5);
    			append_dev(svg4, path6);
    			append_dev(div5, t15);
    			append_dev(div5, svg5);
    			append_dev(svg5, path7);
    			append_dev(div9, t16);
    			append_dev(div9, div7);
    			append_dev(div7, t17);
    			append_dev(div7, svg6);
    			append_dev(svg6, polygon);
    			append_dev(svg6, path8);
    			append_dev(div7, t18);
    			append_dev(div7, div6);
    			append_dev(div6, input1);
    			append_dev(div7, t19);
    			append_dev(div7, svg7);
    			append_dev(svg7, circle1);
    			append_dev(svg7, circle2);
    			append_dev(svg7, path9);
    			append_dev(div9, t20);
    			append_dev(div9, div8);
    			append_dev(div8, button6);
    			if_block1.m(button6, null);
    			append_dev(div8, t21);
    			append_dev(div8, button7);
    			append_dev(button7, svg8);
    			append_dev(svg8, path10);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*toggleLike*/ ctx[5], false, false, false, false),
    					listen_dev(button2, "click", /*skipToStart*/ ctx[6], false, false, false, false),
    					listen_dev(button3, "click", /*togglePlay*/ ctx[4], false, false, false, false),
    					listen_dev(button4, "click", /*skipToEnd*/ ctx[7], false, false, false, false),
    					listen_dev(input0, "input", /*input_handler*/ ctx[8], false, false, false, false),
    					listen_dev(button6, "click", /*togglePlay*/ ctx[4], false, false, false, false),
    					listen_dev(button7, "click", /*skipToEnd*/ ctx[7], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$currentMusic*/ 2 && !src_url_equal(img.src, img_src_value = /*$currentMusic*/ ctx[1].image)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*$currentMusic*/ 2 && svg0_fill_value !== (svg0_fill_value = /*$currentMusic*/ ctx[1].liked ? "#DC2626" : "none")) {
    				attr_dev(svg0, "fill", svg0_fill_value);
    			}

    			if (dirty & /*$currentMusic*/ 2 && svg0_stroke_value !== (svg0_stroke_value = /*$currentMusic*/ ctx[1].liked ? "#DC2626" : "#9CA3AF")) {
    				attr_dev(svg0, "stroke", svg0_stroke_value);
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(button3, null);
    				}
    			}

    			if (dirty & /*currentTime*/ 4 && t10_value !== (t10_value = formatTime(/*currentTime*/ ctx[2]) + "")) set_data_dev(t10, t10_value);

    			if (dirty & /*duration*/ 8 && input0_max_value !== (input0_max_value = /*duration*/ ctx[3] || 0)) {
    				attr_dev(input0, "max", input0_max_value);
    			}

    			if (dirty & /*currentTime*/ 4 && input0_value_value !== (input0_value_value = /*currentTime*/ ctx[2] || 0)) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			if (dirty & /*duration*/ 8 && t13_value !== (t13_value = formatTime(/*duration*/ ctx[3] || 0) + "")) set_data_dev(t13, t13_value);

    			if (current_block_type_1 !== (current_block_type_1 = select_block_type_1(ctx))) {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(button6, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    			if_block0.d();
    			if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(68:0) {#if $currentMusic}",
    		ctx
    	});

    	return block;
    }

    // (101:8) {:else}
    function create_else_block_1(ctx) {
    	let svg;
    	let polygon;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			polygon = svg_element("polygon");
    			attr_dev(polygon, "points", "5,3 27,16 5,29");
    			add_location(polygon, file$3, 102, 12, 3570);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "32");
    			attr_dev(svg, "height", "32");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			add_location(svg, file$3, 101, 10, 3395);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, polygon);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(101:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (96:8) {#if $currentMusic.isPlaying}
    function create_if_block_2$1(ctx) {
    	let svg;
    	let rect0;
    	let rect1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			rect0 = svg_element("rect");
    			rect1 = svg_element("rect");
    			attr_dev(rect0, "x", "6");
    			attr_dev(rect0, "y", "4");
    			attr_dev(rect0, "width", "4");
    			attr_dev(rect0, "height", "24");
    			add_location(rect0, file$3, 97, 12, 3251);
    			attr_dev(rect1, "x", "22");
    			attr_dev(rect1, "y", "4");
    			attr_dev(rect1, "width", "4");
    			attr_dev(rect1, "height", "24");
    			add_location(rect1, file$3, 98, 12, 3306);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "32");
    			attr_dev(svg, "height", "32");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			add_location(svg, file$3, 96, 10, 3076);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, rect0);
    			append_dev(svg, rect1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(96:8) {#if $currentMusic.isPlaying}",
    		ctx
    	});

    	return block;
    }

    // (150:8) {:else}
    function create_else_block$1(ctx) {
    	let svg;
    	let polygon;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			polygon = svg_element("polygon");
    			attr_dev(polygon, "points", "5,3 27,16 5,29");
    			add_location(polygon, file$3, 151, 12, 6412);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "32");
    			attr_dev(svg, "height", "32");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			add_location(svg, file$3, 150, 10, 6237);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, polygon);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(150:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (145:8) {#if $currentMusic.isPlaying}
    function create_if_block_1$1(ctx) {
    	let svg;
    	let rect0;
    	let rect1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			rect0 = svg_element("rect");
    			rect1 = svg_element("rect");
    			attr_dev(rect0, "x", "6");
    			attr_dev(rect0, "y", "4");
    			attr_dev(rect0, "width", "4");
    			attr_dev(rect0, "height", "24");
    			add_location(rect0, file$3, 146, 12, 6093);
    			attr_dev(rect1, "x", "22");
    			attr_dev(rect1, "y", "4");
    			attr_dev(rect1, "width", "4");
    			attr_dev(rect1, "height", "24");
    			add_location(rect1, file$3, 147, 12, 6148);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "32");
    			attr_dev(svg, "height", "32");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			add_location(svg, file$3, 145, 10, 5918);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, rect0);
    			append_dev(svg, rect1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(145:8) {#if $currentMusic.isPlaying}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;
    	let if_block = /*$currentMusic*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$currentMusic*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function formatTime(seconds) {
    	const minutes = Math.floor(seconds / 60);
    	const remainingSeconds = Math.floor(seconds % 60);
    	return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $currentMusic;
    	validate_store(currentMusic, 'currentMusic');
    	component_subscribe($$self, currentMusic, $$value => $$invalidate(1, $currentMusic = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MusicPlayer', slots, []);
    	let audio = null;
    	let currentTime = 0;
    	let duration = 0;

    	function togglePlay() {
    		if ($currentMusic) {
    			if ($currentMusic.isPlaying) {
    				audio?.pause();
    			} else {
    				audio?.play();
    			}

    			set_store_value(currentMusic, $currentMusic.isPlaying = !$currentMusic.isPlaying, $currentMusic);
    		}
    	}

    	function toggleLike() {
    		if ($currentMusic) {
    			set_store_value(currentMusic, $currentMusic.liked = !$currentMusic.liked, $currentMusic);
    		}
    	}

    	function updateTime() {
    		if (audio) {
    			$$invalidate(2, currentTime = audio.currentTime || 0);
    			$$invalidate(3, duration = audio.duration || 0);
    		}
    	}

    	function skipToStart() {
    		if (audio) {
    			$$invalidate(0, audio.currentTime = 0, audio);
    		}
    	}

    	function skipToEnd() {
    		if (audio) {
    			$$invalidate(0, audio.currentTime = audio.duration, audio);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<MusicPlayer> was created with unknown prop '${key}'`);
    	});

    	const input_handler = e => $$invalidate(0, audio.currentTime = e.target.value, audio);

    	$$self.$capture_state = () => ({
    		currentMusic,
    		audio,
    		currentTime,
    		duration,
    		togglePlay,
    		toggleLike,
    		updateTime,
    		skipToStart,
    		skipToEnd,
    		formatTime,
    		$currentMusic
    	});

    	$$self.$inject_state = $$props => {
    		if ('audio' in $$props) $$invalidate(0, audio = $$props.audio);
    		if ('currentTime' in $$props) $$invalidate(2, currentTime = $$props.currentTime);
    		if ('duration' in $$props) $$invalidate(3, duration = $$props.duration);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$currentMusic, audio*/ 3) {
    			if ($currentMusic) {
    				if (!audio) {
    					$$invalidate(0, audio = new Audio('/music/sample.mp3'));
    					audio.addEventListener('timeupdate', updateTime);

    					audio.addEventListener('ended', () => {
    						set_store_value(currentMusic, $currentMusic.isPlaying = false, $currentMusic);
    					});
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*$currentMusic, audio*/ 3) {
    			if (!$currentMusic && audio) {
    				audio.pause();
    				$$invalidate(0, audio.currentTime = 0, audio);
    				$$invalidate(0, audio = null);
    			}
    		}
    	};

    	return [
    		audio,
    		$currentMusic,
    		currentTime,
    		duration,
    		togglePlay,
    		toggleLike,
    		skipToStart,
    		skipToEnd,
    		input_handler
    	];
    }

    class MusicPlayer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MusicPlayer",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\MusicSection.svelte generated by Svelte v3.59.2 */
    const file$2 = "src\\components\\MusicSection.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    function get_each_context_6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    function get_each_context_7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    function get_each_context_8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    function get_each_context_9(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    function get_each_context_10(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[28] = list[i];
    	return child_ctx;
    }

    // (63:4) {#each artists as artist}
    function create_each_block_10(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1_value = /*artist*/ ctx[28].name + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[5](/*artist*/ ctx[28]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = /*artist*/ ctx[28].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*artist*/ ctx[28].name);
    			attr_dev(img, "class", "artist-image svelte-1o194oz");
    			add_location(img, file$2, 64, 8, 2115);
    			attr_dev(div0, "class", "artist-name svelte-1o194oz");
    			add_location(div0, file$2, 69, 8, 2232);
    			attr_dev(div1, "class", "artist-card svelte-1o194oz");
    			add_location(div1, file$2, 63, 6, 2042);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div1, t2);

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_10.name,
    		type: "each",
    		source: "(63:4) {#each artists as artist}",
    		ctx
    	});

    	return block;
    }

    // (86:4) {#each artist2 as artist2}
    function create_each_block_9(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1_value = /*artist2*/ ctx[2].name + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = /*artist2*/ ctx[2].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*artist2*/ ctx[2].name);
    			attr_dev(img, "class", "artist-image svelte-1o194oz");
    			add_location(img, file$2, 87, 8, 2814);
    			attr_dev(div0, "class", "artist-name svelte-1o194oz");
    			add_location(div0, file$2, 92, 8, 2934);
    			attr_dev(div1, "class", "artist-card svelte-1o194oz");
    			add_location(div1, file$2, 86, 6, 2779);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div1, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_9.name,
    		type: "each",
    		source: "(86:4) {#each artist2 as artist2}",
    		ctx
    	});

    	return block;
    }

    // (108:4) {#each artist2 as artist2}
    function create_each_block_8(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1_value = /*artist2*/ ctx[2].name + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = /*artist2*/ ctx[2].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*artist2*/ ctx[2].name);
    			attr_dev(img, "class", "artist-image3 svelte-1o194oz");
    			add_location(img, file$2, 109, 8, 3497);
    			attr_dev(div0, "class", "artist-name svelte-1o194oz");
    			add_location(div0, file$2, 114, 8, 3618);
    			attr_dev(div1, "class", "artist-card svelte-1o194oz");
    			add_location(div1, file$2, 108, 6, 3462);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div1, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_8.name,
    		type: "each",
    		source: "(108:4) {#each artist2 as artist2}",
    		ctx
    	});

    	return block;
    }

    // (130:4) {#each artist3 as artist3}
    function create_each_block_7(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1_value = /*artist3*/ ctx[3].name + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = /*artist3*/ ctx[3].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*artist3*/ ctx[3].name);
    			attr_dev(img, "class", "artist-image4 svelte-1o194oz");
    			add_location(img, file$2, 131, 8, 4227);
    			attr_dev(div0, "class", "artist-name svelte-1o194oz");
    			add_location(div0, file$2, 136, 8, 4348);
    			attr_dev(div1, "class", "artist-card svelte-1o194oz");
    			add_location(div1, file$2, 130, 6, 4192);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div1, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_7.name,
    		type: "each",
    		source: "(130:4) {#each artist3 as artist3}",
    		ctx
    	});

    	return block;
    }

    // (152:4) {#each artist4 as artist4}
    function create_each_block_6(ctx) {
    	let div2;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let div0;
    	let t1_value = /*artist4*/ ctx[4].name + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = /*artist4*/ ctx[4].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*artist4*/ ctx[4].name);
    			attr_dev(img, "class", "artist-image-3x2 svelte-1o194oz");
    			add_location(img, file$2, 153, 8, 4913);
    			attr_dev(div0, "class", "artist-name svelte-1o194oz");
    			add_location(div0, file$2, 159, 10, 5082);
    			attr_dev(div1, "class", "artist-text-area-3x2 svelte-1o194oz");
    			add_location(div1, file$2, 158, 8, 5036);
    			attr_dev(div2, "class", "artist-card-3x2 svelte-1o194oz");
    			add_location(div2, file$2, 152, 6, 4874);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div2, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_6.name,
    		type: "each",
    		source: "(152:4) {#each artist4 as artist4}",
    		ctx
    	});

    	return block;
    }

    // (176:4) {#each artist2 as artist2}
    function create_each_block_5(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1_value = /*artist2*/ ctx[2].name + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = /*artist2*/ ctx[2].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*artist2*/ ctx[2].name);
    			attr_dev(img, "class", "artist-image svelte-1o194oz");
    			add_location(img, file$2, 177, 8, 5643);
    			attr_dev(div0, "class", "artist-name svelte-1o194oz");
    			add_location(div0, file$2, 182, 8, 5763);
    			attr_dev(div1, "class", "artist-card svelte-1o194oz");
    			add_location(div1, file$2, 176, 6, 5608);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div1, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(176:4) {#each artist2 as artist2}",
    		ctx
    	});

    	return block;
    }

    // (198:4) {#each artist2 as artist2}
    function create_each_block_4(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1_value = /*artist2*/ ctx[2].name + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = /*artist2*/ ctx[2].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*artist2*/ ctx[2].name);
    			attr_dev(img, "class", "artist-image3 svelte-1o194oz");
    			add_location(img, file$2, 199, 8, 6318);
    			attr_dev(div0, "class", "artist-name svelte-1o194oz");
    			add_location(div0, file$2, 204, 8, 6439);
    			attr_dev(div1, "class", "artist-card svelte-1o194oz");
    			add_location(div1, file$2, 198, 6, 6283);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div1, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(198:4) {#each artist2 as artist2}",
    		ctx
    	});

    	return block;
    }

    // (220:4) {#each artist2 as artist2}
    function create_each_block_3(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1_value = /*artist2*/ ctx[2].name + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = /*artist2*/ ctx[2].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*artist2*/ ctx[2].name);
    			attr_dev(img, "class", "artist-image svelte-1o194oz");
    			add_location(img, file$2, 221, 8, 6990);
    			attr_dev(div0, "class", "artist-name svelte-1o194oz");
    			add_location(div0, file$2, 226, 8, 7110);
    			attr_dev(div1, "class", "artist-card svelte-1o194oz");
    			add_location(div1, file$2, 220, 6, 6955);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div1, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(220:4) {#each artist2 as artist2}",
    		ctx
    	});

    	return block;
    }

    // (234:4) {#each artist2 as artist2}
    function create_each_block_2(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1_value = /*artist2*/ ctx[2].name + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = /*artist2*/ ctx[2].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*artist2*/ ctx[2].name);
    			attr_dev(img, "class", "artist-image svelte-1o194oz");
    			add_location(img, file$2, 235, 8, 7351);
    			attr_dev(div0, "class", "artist-name svelte-1o194oz");
    			add_location(div0, file$2, 240, 8, 7471);
    			attr_dev(div1, "class", "artist-card svelte-1o194oz");
    			add_location(div1, file$2, 234, 6, 7316);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div1, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(234:4) {#each artist2 as artist2}",
    		ctx
    	});

    	return block;
    }

    // (256:4) {#each artist2 as artist2}
    function create_each_block_1(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1_value = /*artist2*/ ctx[2].name + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = /*artist2*/ ctx[2].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*artist2*/ ctx[2].name);
    			attr_dev(img, "class", "artist-image-bot svelte-1o194oz");
    			add_location(img, file$2, 257, 8, 8046);
    			attr_dev(div0, "class", "artist-name svelte-1o194oz");
    			add_location(div0, file$2, 262, 8, 8170);
    			attr_dev(div1, "class", "artist-card svelte-1o194oz");
    			add_location(div1, file$2, 256, 6, 8011);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div1, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(256:4) {#each artist2 as artist2}",
    		ctx
    	});

    	return block;
    }

    // (269:4) {#each artist2 as artist2}
    function create_each_block(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1_value = /*artist2*/ ctx[2].name + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = /*artist2*/ ctx[2].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*artist2*/ ctx[2].name);
    			attr_dev(img, "class", "artist-image-bot svelte-1o194oz");
    			add_location(img, file$2, 270, 8, 8383);
    			attr_dev(div0, "class", "artist-name svelte-1o194oz");
    			add_location(div0, file$2, 275, 8, 8507);
    			attr_dev(div1, "class", "artist-card svelte-1o194oz");
    			add_location(div1, file$2, 269, 6, 8348);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div1, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(269:4) {#each artist2 as artist2}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div57;
    	let div56;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div2;
    	let div1;
    	let t2;
    	let div3;
    	let t3;
    	let div4;
    	let t4;
    	let div8;
    	let div6;
    	let div5;
    	let t6;
    	let a0;
    	let t8;
    	let div7;
    	let t10;
    	let div9;
    	let t11;
    	let div10;
    	let t12;
    	let div14;
    	let div12;
    	let div11;
    	let t14;
    	let a1;
    	let t16;
    	let div13;
    	let t18;
    	let div15;
    	let t19;
    	let div16;
    	let t20;
    	let div20;
    	let div18;
    	let div17;
    	let t22;
    	let a2;
    	let t24;
    	let div19;
    	let t26;
    	let div21;
    	let t27;
    	let div22;
    	let t28;
    	let div26;
    	let div24;
    	let div23;
    	let t30;
    	let a3;
    	let t32;
    	let div25;
    	let t34;
    	let div27;
    	let t35;
    	let div28;
    	let t36;
    	let div32;
    	let div30;
    	let div29;
    	let t38;
    	let a4;
    	let t40;
    	let div31;
    	let t42;
    	let div33;
    	let t43;
    	let div34;
    	let t44;
    	let div38;
    	let div36;
    	let div35;
    	let t46;
    	let a5;
    	let t48;
    	let div37;
    	let t50;
    	let div39;
    	let t51;
    	let div40;
    	let t52;
    	let div44;
    	let div42;
    	let div41;
    	let t54;
    	let a6;
    	let t56;
    	let div43;
    	let t58;
    	let div45;
    	let t59;
    	let div46;
    	let t60;
    	let div47;
    	let t61;
    	let div48;
    	let t62;
    	let div52;
    	let div50;
    	let div49;
    	let t64;
    	let a7;
    	let t66;
    	let div51;
    	let t68;
    	let div53;
    	let t69;
    	let div54;
    	let t70;
    	let div55;
    	let each_value_10 = /*artists*/ ctx[0];
    	validate_each_argument(each_value_10);
    	let each_blocks_10 = [];

    	for (let i = 0; i < each_value_10.length; i += 1) {
    		each_blocks_10[i] = create_each_block_10(get_each_context_10(ctx, each_value_10, i));
    	}

    	let each_value_9 = /*artist2*/ ctx[2];
    	validate_each_argument(each_value_9);
    	let each_blocks_9 = [];

    	for (let i = 0; i < each_value_9.length; i += 1) {
    		each_blocks_9[i] = create_each_block_9(get_each_context_9(ctx, each_value_9, i));
    	}

    	let each_value_8 = /*artist2*/ ctx[2];
    	validate_each_argument(each_value_8);
    	let each_blocks_8 = [];

    	for (let i = 0; i < each_value_8.length; i += 1) {
    		each_blocks_8[i] = create_each_block_8(get_each_context_8(ctx, each_value_8, i));
    	}

    	let each_value_7 = /*artist3*/ ctx[3];
    	validate_each_argument(each_value_7);
    	let each_blocks_7 = [];

    	for (let i = 0; i < each_value_7.length; i += 1) {
    		each_blocks_7[i] = create_each_block_7(get_each_context_7(ctx, each_value_7, i));
    	}

    	let each_value_6 = /*artist4*/ ctx[4];
    	validate_each_argument(each_value_6);
    	let each_blocks_6 = [];

    	for (let i = 0; i < each_value_6.length; i += 1) {
    		each_blocks_6[i] = create_each_block_6(get_each_context_6(ctx, each_value_6, i));
    	}

    	let each_value_5 = /*artist2*/ ctx[2];
    	validate_each_argument(each_value_5);
    	let each_blocks_5 = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks_5[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
    	}

    	let each_value_4 = /*artist2*/ ctx[2];
    	validate_each_argument(each_value_4);
    	let each_blocks_4 = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks_4[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	let each_value_3 = /*artist2*/ ctx[2];
    	validate_each_argument(each_value_3);
    	let each_blocks_3 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_3[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_2 = /*artist2*/ ctx[2];
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*artist2*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*artist2*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div57 = element("div");
    			div56 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			div1.textContent = "New Hot";
    			t2 = space();
    			div3 = element("div");
    			t3 = space();
    			div4 = element("div");

    			for (let i = 0; i < each_blocks_10.length; i += 1) {
    				each_blocks_10[i].c();
    			}

    			t4 = space();
    			div8 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div5.textContent = "Шинээр нэмэгдсэн бүтээлүүд";
    			t6 = space();
    			a0 = element("a");
    			a0.textContent = "Бүгд үзэх";
    			t8 = space();
    			div7 = element("div");
    			div7.textContent = "Таны дагасан уран бүтээлчдээс тулгуурласан миксүүд";
    			t10 = space();
    			div9 = element("div");
    			t11 = space();
    			div10 = element("div");

    			for (let i = 0; i < each_blocks_9.length; i += 1) {
    				each_blocks_9[i].c();
    			}

    			t12 = space();
    			div14 = element("div");
    			div12 = element("div");
    			div11 = element("div");
    			div11.textContent = "Шинэ уран бүтээлч";
    			t14 = space();
    			a1 = element("a");
    			a1.textContent = "Бүгд үзэх";
    			t16 = space();
    			div13 = element("div");
    			div13.textContent = "Таны дагасан уран бүтээлчдээс тулгуурласан миксүүд";
    			t18 = space();
    			div15 = element("div");
    			t19 = space();
    			div16 = element("div");

    			for (let i = 0; i < each_blocks_8.length; i += 1) {
    				each_blocks_8[i].c();
    			}

    			t20 = space();
    			div20 = element("div");
    			div18 = element("div");
    			div17 = element("div");
    			div17.textContent = "Шинээр нэмэгдсэн хамтрал уран бүтээлчид";
    			t22 = space();
    			a2 = element("a");
    			a2.textContent = "Бүгд үзэх";
    			t24 = space();
    			div19 = element("div");
    			div19.textContent = "Таны дагасан уран бүтээлчдээс тулгуурласан миксүүд";
    			t26 = space();
    			div21 = element("div");
    			t27 = space();
    			div22 = element("div");

    			for (let i = 0; i < each_blocks_7.length; i += 1) {
    				each_blocks_7[i].c();
    			}

    			t28 = space();
    			div26 = element("div");
    			div24 = element("div");
    			div23 = element("div");
    			div23.textContent = "Санал болгох";
    			t30 = space();
    			a3 = element("a");
    			a3.textContent = "Бүгд үзэх";
    			t32 = space();
    			div25 = element("div");
    			div25.textContent = "Таны дагасан уран бүтээлчдээс тулгуурласан миксүүд";
    			t34 = space();
    			div27 = element("div");
    			t35 = space();
    			div28 = element("div");

    			for (let i = 0; i < each_blocks_6.length; i += 1) {
    				each_blocks_6[i].c();
    			}

    			t36 = space();
    			div32 = element("div");
    			div30 = element("div");
    			div29 = element("div");
    			div29.textContent = "Mood mix";
    			t38 = space();
    			a4 = element("a");
    			a4.textContent = "Бүгд үзэх";
    			t40 = space();
    			div31 = element("div");
    			div31.textContent = "Таны дагасан уран бүтээлчдээс тулгуурласан миксүүд";
    			t42 = space();
    			div33 = element("div");
    			t43 = space();
    			div34 = element("div");

    			for (let i = 0; i < each_blocks_5.length; i += 1) {
    				each_blocks_5[i].c();
    			}

    			t44 = space();
    			div38 = element("div");
    			div36 = element("div");
    			div35 = element("div");
    			div35.textContent = "Сонгосон жанр";
    			t46 = space();
    			a5 = element("a");
    			a5.textContent = "Бүгд үзэх";
    			t48 = space();
    			div37 = element("div");
    			div37.textContent = "Таны дагасан уран бүтээлчдээс тулгуурласан миксүүд";
    			t50 = space();
    			div39 = element("div");
    			t51 = space();
    			div40 = element("div");

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				each_blocks_4[i].c();
    			}

    			t52 = space();
    			div44 = element("div");
    			div42 = element("div");
    			div41 = element("div");
    			div41.textContent = "MMusic mix";
    			t54 = space();
    			a6 = element("a");
    			a6.textContent = "Бүгд үзэх";
    			t56 = space();
    			div43 = element("div");
    			div43.textContent = "Таны дагасан уран бүтээлчдээс тулгуурласан миксүүд";
    			t58 = space();
    			div45 = element("div");
    			t59 = space();
    			div46 = element("div");

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t60 = space();
    			div47 = element("div");
    			t61 = space();
    			div48 = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t62 = space();
    			div52 = element("div");
    			div50 = element("div");
    			div49 = element("div");
    			div49.textContent = "Өөр дуу сонсож үзэх үү?";
    			t64 = space();
    			a7 = element("a");
    			a7.textContent = "Бүгд үзэх";
    			t66 = space();
    			div51 = element("div");
    			div51.textContent = "Таны дагасан уран бүтээлчдээс тулгуурласан миксүүд";
    			t68 = space();
    			div53 = element("div");
    			t69 = space();
    			div54 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t70 = space();
    			div55 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(img, "class", "Feature-img svelte-1o194oz");
    			if (!src_url_equal(img.src, img_src_value = "/images/Feature.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Feature");
    			add_location(img, file$2, 50, 4, 1725);
    			attr_dev(div0, "class", "Feature svelte-1o194oz");
    			add_location(div0, file$2, 49, 2, 1698);
    			attr_dev(div1, "class", "hot-title svelte-1o194oz");
    			add_location(div1, file$2, 55, 4, 1871);
    			attr_dev(div2, "class", "section-header svelte-1o194oz");
    			add_location(div2, file$2, 54, 2, 1837);
    			attr_dev(div3, "class", "line svelte-1o194oz");
    			add_location(div3, file$2, 58, 2, 1923);
    			attr_dev(div4, "class", "artist-grid svelte-1o194oz");
    			add_location(div4, file$2, 61, 2, 1978);
    			attr_dev(div5, "class", "hot-title svelte-1o194oz");
    			add_location(div5, file$2, 77, 6, 2437);
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "class", "view-all svelte-1o194oz");
    			add_location(a0, file$2, 78, 6, 2500);
    			attr_dev(div6, "class", "title-container svelte-1o194oz");
    			add_location(div6, file$2, 76, 4, 2400);
    			attr_dev(div7, "class", "additional-text svelte-1o194oz");
    			add_location(div7, file$2, 80, 4, 2560);
    			attr_dev(div8, "class", "section-header svelte-1o194oz");
    			add_location(div8, file$2, 75, 2, 2366);
    			attr_dev(div9, "class", "line svelte-1o194oz");
    			add_location(div9, file$2, 82, 2, 2659);
    			attr_dev(div10, "class", "artist-grid svelte-1o194oz");
    			add_location(div10, file$2, 84, 2, 2714);
    			attr_dev(div11, "class", "hot-title svelte-1o194oz");
    			add_location(div11, file$2, 99, 6, 3129);
    			attr_dev(a1, "href", "#");
    			attr_dev(a1, "class", "view-all svelte-1o194oz");
    			add_location(a1, file$2, 100, 6, 3183);
    			attr_dev(div12, "class", "title-container svelte-1o194oz");
    			add_location(div12, file$2, 98, 4, 3092);
    			attr_dev(div13, "class", "additional-text svelte-1o194oz");
    			add_location(div13, file$2, 102, 4, 3243);
    			attr_dev(div14, "class", "section-header svelte-1o194oz");
    			add_location(div14, file$2, 97, 2, 3058);
    			attr_dev(div15, "class", "line svelte-1o194oz");
    			add_location(div15, file$2, 104, 2, 3342);
    			attr_dev(div16, "class", "artist-grid svelte-1o194oz");
    			add_location(div16, file$2, 106, 2, 3397);
    			attr_dev(div17, "class", "hot-title svelte-1o194oz");
    			add_location(div17, file$2, 121, 6, 3837);
    			attr_dev(a2, "href", "#");
    			attr_dev(a2, "class", "view-all svelte-1o194oz");
    			add_location(a2, file$2, 122, 6, 3913);
    			attr_dev(div18, "class", "title-container svelte-1o194oz");
    			add_location(div18, file$2, 120, 4, 3800);
    			attr_dev(div19, "class", "additional-text svelte-1o194oz");
    			add_location(div19, file$2, 124, 4, 3973);
    			attr_dev(div20, "class", "section-header svelte-1o194oz");
    			add_location(div20, file$2, 119, 2, 3766);
    			attr_dev(div21, "class", "line svelte-1o194oz");
    			add_location(div21, file$2, 126, 2, 4072);
    			attr_dev(div22, "class", "artist-grid svelte-1o194oz");
    			add_location(div22, file$2, 128, 2, 4127);
    			attr_dev(div23, "class", "hot-title svelte-1o194oz");
    			add_location(div23, file$2, 143, 6, 4540);
    			attr_dev(a3, "href", "#");
    			attr_dev(a3, "class", "view-all svelte-1o194oz");
    			add_location(a3, file$2, 144, 6, 4589);
    			attr_dev(div24, "class", "title-container svelte-1o194oz");
    			add_location(div24, file$2, 142, 4, 4503);
    			attr_dev(div25, "class", "additional-text svelte-1o194oz");
    			add_location(div25, file$2, 146, 4, 4649);
    			attr_dev(div26, "class", "section-header svelte-1o194oz");
    			add_location(div26, file$2, 141, 2, 4469);
    			attr_dev(div27, "class", "line svelte-1o194oz");
    			add_location(div27, file$2, 148, 2, 4748);
    			attr_dev(div28, "class", "artist-grid-3x2 svelte-1o194oz");
    			add_location(div28, file$2, 150, 2, 4805);
    			attr_dev(div29, "class", "hot-title svelte-1o194oz");
    			add_location(div29, file$2, 167, 6, 5284);
    			attr_dev(a4, "href", "#");
    			attr_dev(a4, "class", "view-all svelte-1o194oz");
    			add_location(a4, file$2, 168, 6, 5329);
    			attr_dev(div30, "class", "title-container svelte-1o194oz");
    			add_location(div30, file$2, 166, 4, 5247);
    			attr_dev(div31, "class", "additional-text svelte-1o194oz");
    			add_location(div31, file$2, 170, 4, 5389);
    			attr_dev(div32, "class", "section-header svelte-1o194oz");
    			add_location(div32, file$2, 165, 2, 5213);
    			attr_dev(div33, "class", "line svelte-1o194oz");
    			add_location(div33, file$2, 172, 2, 5488);
    			attr_dev(div34, "class", "artist-grid svelte-1o194oz");
    			add_location(div34, file$2, 174, 2, 5543);
    			attr_dev(div35, "class", "hot-title svelte-1o194oz");
    			add_location(div35, file$2, 189, 6, 5954);
    			attr_dev(a5, "href", "#");
    			attr_dev(a5, "class", "view-all svelte-1o194oz");
    			add_location(a5, file$2, 190, 6, 6004);
    			attr_dev(div36, "class", "title-container svelte-1o194oz");
    			add_location(div36, file$2, 188, 4, 5917);
    			attr_dev(div37, "class", "additional-text svelte-1o194oz");
    			add_location(div37, file$2, 192, 4, 6064);
    			attr_dev(div38, "class", "section-header svelte-1o194oz");
    			add_location(div38, file$2, 187, 2, 5883);
    			attr_dev(div39, "class", "line svelte-1o194oz");
    			add_location(div39, file$2, 194, 2, 6163);
    			attr_dev(div40, "class", "artist-grid svelte-1o194oz");
    			add_location(div40, file$2, 196, 2, 6218);
    			attr_dev(div41, "class", "hot-title svelte-1o194oz");
    			add_location(div41, file$2, 211, 6, 6629);
    			attr_dev(a6, "href", "#");
    			attr_dev(a6, "class", "view-all svelte-1o194oz");
    			add_location(a6, file$2, 212, 6, 6676);
    			attr_dev(div42, "class", "title-container svelte-1o194oz");
    			add_location(div42, file$2, 210, 4, 6592);
    			attr_dev(div43, "class", "additional-text svelte-1o194oz");
    			add_location(div43, file$2, 214, 4, 6736);
    			attr_dev(div44, "class", "section-header svelte-1o194oz");
    			add_location(div44, file$2, 209, 2, 6558);
    			attr_dev(div45, "class", "line svelte-1o194oz");
    			add_location(div45, file$2, 216, 2, 6835);
    			attr_dev(div46, "class", "artist-grid svelte-1o194oz");
    			add_location(div46, file$2, 218, 2, 6890);
    			attr_dev(div47, "class", "line svelte-1o194oz");
    			add_location(div47, file$2, 230, 2, 7196);
    			attr_dev(div48, "class", "artist-grid svelte-1o194oz");
    			add_location(div48, file$2, 232, 2, 7251);
    			attr_dev(div49, "class", "hot-title svelte-1o194oz");
    			add_location(div49, file$2, 247, 6, 7672);
    			attr_dev(a7, "href", "#");
    			attr_dev(a7, "class", "view-all svelte-1o194oz");
    			add_location(a7, file$2, 248, 6, 7732);
    			attr_dev(div50, "class", "title-container svelte-1o194oz");
    			add_location(div50, file$2, 246, 4, 7635);
    			attr_dev(div51, "class", "additional-text svelte-1o194oz");
    			add_location(div51, file$2, 250, 4, 7792);
    			attr_dev(div52, "class", "section-header svelte-1o194oz");
    			add_location(div52, file$2, 245, 2, 7601);
    			attr_dev(div53, "class", "line svelte-1o194oz");
    			add_location(div53, file$2, 252, 2, 7891);
    			attr_dev(div54, "class", "artist-grid svelte-1o194oz");
    			add_location(div54, file$2, 254, 2, 7946);
    			attr_dev(div55, "class", "artist-grid svelte-1o194oz");
    			add_location(div55, file$2, 267, 2, 8283);
    			attr_dev(div56, "class", "music-section svelte-1o194oz");
    			add_location(div56, file$2, 47, 0, 1633);
    			attr_dev(div57, "class", "scrollable-section svelte-1o194oz");
    			add_location(div57, file$2, 46, 0, 1599);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div57, anchor);
    			append_dev(div57, div56);
    			append_dev(div56, div0);
    			append_dev(div0, img);
    			append_dev(div56, t0);
    			append_dev(div56, div2);
    			append_dev(div2, div1);
    			append_dev(div56, t2);
    			append_dev(div56, div3);
    			append_dev(div56, t3);
    			append_dev(div56, div4);

    			for (let i = 0; i < each_blocks_10.length; i += 1) {
    				if (each_blocks_10[i]) {
    					each_blocks_10[i].m(div4, null);
    				}
    			}

    			append_dev(div56, t4);
    			append_dev(div56, div8);
    			append_dev(div8, div6);
    			append_dev(div6, div5);
    			append_dev(div6, t6);
    			append_dev(div6, a0);
    			append_dev(div8, t8);
    			append_dev(div8, div7);
    			append_dev(div56, t10);
    			append_dev(div56, div9);
    			append_dev(div56, t11);
    			append_dev(div56, div10);

    			for (let i = 0; i < each_blocks_9.length; i += 1) {
    				if (each_blocks_9[i]) {
    					each_blocks_9[i].m(div10, null);
    				}
    			}

    			append_dev(div56, t12);
    			append_dev(div56, div14);
    			append_dev(div14, div12);
    			append_dev(div12, div11);
    			append_dev(div12, t14);
    			append_dev(div12, a1);
    			append_dev(div14, t16);
    			append_dev(div14, div13);
    			append_dev(div56, t18);
    			append_dev(div56, div15);
    			append_dev(div56, t19);
    			append_dev(div56, div16);

    			for (let i = 0; i < each_blocks_8.length; i += 1) {
    				if (each_blocks_8[i]) {
    					each_blocks_8[i].m(div16, null);
    				}
    			}

    			append_dev(div56, t20);
    			append_dev(div56, div20);
    			append_dev(div20, div18);
    			append_dev(div18, div17);
    			append_dev(div18, t22);
    			append_dev(div18, a2);
    			append_dev(div20, t24);
    			append_dev(div20, div19);
    			append_dev(div56, t26);
    			append_dev(div56, div21);
    			append_dev(div56, t27);
    			append_dev(div56, div22);

    			for (let i = 0; i < each_blocks_7.length; i += 1) {
    				if (each_blocks_7[i]) {
    					each_blocks_7[i].m(div22, null);
    				}
    			}

    			append_dev(div56, t28);
    			append_dev(div56, div26);
    			append_dev(div26, div24);
    			append_dev(div24, div23);
    			append_dev(div24, t30);
    			append_dev(div24, a3);
    			append_dev(div26, t32);
    			append_dev(div26, div25);
    			append_dev(div56, t34);
    			append_dev(div56, div27);
    			append_dev(div56, t35);
    			append_dev(div56, div28);

    			for (let i = 0; i < each_blocks_6.length; i += 1) {
    				if (each_blocks_6[i]) {
    					each_blocks_6[i].m(div28, null);
    				}
    			}

    			append_dev(div56, t36);
    			append_dev(div56, div32);
    			append_dev(div32, div30);
    			append_dev(div30, div29);
    			append_dev(div30, t38);
    			append_dev(div30, a4);
    			append_dev(div32, t40);
    			append_dev(div32, div31);
    			append_dev(div56, t42);
    			append_dev(div56, div33);
    			append_dev(div56, t43);
    			append_dev(div56, div34);

    			for (let i = 0; i < each_blocks_5.length; i += 1) {
    				if (each_blocks_5[i]) {
    					each_blocks_5[i].m(div34, null);
    				}
    			}

    			append_dev(div56, t44);
    			append_dev(div56, div38);
    			append_dev(div38, div36);
    			append_dev(div36, div35);
    			append_dev(div36, t46);
    			append_dev(div36, a5);
    			append_dev(div38, t48);
    			append_dev(div38, div37);
    			append_dev(div56, t50);
    			append_dev(div56, div39);
    			append_dev(div56, t51);
    			append_dev(div56, div40);

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				if (each_blocks_4[i]) {
    					each_blocks_4[i].m(div40, null);
    				}
    			}

    			append_dev(div56, t52);
    			append_dev(div56, div44);
    			append_dev(div44, div42);
    			append_dev(div42, div41);
    			append_dev(div42, t54);
    			append_dev(div42, a6);
    			append_dev(div44, t56);
    			append_dev(div44, div43);
    			append_dev(div56, t58);
    			append_dev(div56, div45);
    			append_dev(div56, t59);
    			append_dev(div56, div46);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				if (each_blocks_3[i]) {
    					each_blocks_3[i].m(div46, null);
    				}
    			}

    			append_dev(div56, t60);
    			append_dev(div56, div47);
    			append_dev(div56, t61);
    			append_dev(div56, div48);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				if (each_blocks_2[i]) {
    					each_blocks_2[i].m(div48, null);
    				}
    			}

    			append_dev(div56, t62);
    			append_dev(div56, div52);
    			append_dev(div52, div50);
    			append_dev(div50, div49);
    			append_dev(div50, t64);
    			append_dev(div50, a7);
    			append_dev(div52, t66);
    			append_dev(div52, div51);
    			append_dev(div56, t68);
    			append_dev(div56, div53);
    			append_dev(div56, t69);
    			append_dev(div56, div54);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(div54, null);
    				}
    			}

    			append_dev(div56, t70);
    			append_dev(div56, div55);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div55, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selectArtist, artists*/ 3) {
    				each_value_10 = /*artists*/ ctx[0];
    				validate_each_argument(each_value_10);
    				let i;

    				for (i = 0; i < each_value_10.length; i += 1) {
    					const child_ctx = get_each_context_10(ctx, each_value_10, i);

    					if (each_blocks_10[i]) {
    						each_blocks_10[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_10[i] = create_each_block_10(child_ctx);
    						each_blocks_10[i].c();
    						each_blocks_10[i].m(div4, null);
    					}
    				}

    				for (; i < each_blocks_10.length; i += 1) {
    					each_blocks_10[i].d(1);
    				}

    				each_blocks_10.length = each_value_10.length;
    			}

    			if (dirty & /*artist2*/ 4) {
    				each_value_9 = /*artist2*/ ctx[2];
    				validate_each_argument(each_value_9);
    				let i;

    				for (i = 0; i < each_value_9.length; i += 1) {
    					const child_ctx = get_each_context_9(ctx, each_value_9, i);

    					if (each_blocks_9[i]) {
    						each_blocks_9[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_9[i] = create_each_block_9(child_ctx);
    						each_blocks_9[i].c();
    						each_blocks_9[i].m(div10, null);
    					}
    				}

    				for (; i < each_blocks_9.length; i += 1) {
    					each_blocks_9[i].d(1);
    				}

    				each_blocks_9.length = each_value_9.length;
    			}

    			if (dirty & /*artist2*/ 4) {
    				each_value_8 = /*artist2*/ ctx[2];
    				validate_each_argument(each_value_8);
    				let i;

    				for (i = 0; i < each_value_8.length; i += 1) {
    					const child_ctx = get_each_context_8(ctx, each_value_8, i);

    					if (each_blocks_8[i]) {
    						each_blocks_8[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_8[i] = create_each_block_8(child_ctx);
    						each_blocks_8[i].c();
    						each_blocks_8[i].m(div16, null);
    					}
    				}

    				for (; i < each_blocks_8.length; i += 1) {
    					each_blocks_8[i].d(1);
    				}

    				each_blocks_8.length = each_value_8.length;
    			}

    			if (dirty & /*artist3*/ 8) {
    				each_value_7 = /*artist3*/ ctx[3];
    				validate_each_argument(each_value_7);
    				let i;

    				for (i = 0; i < each_value_7.length; i += 1) {
    					const child_ctx = get_each_context_7(ctx, each_value_7, i);

    					if (each_blocks_7[i]) {
    						each_blocks_7[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_7[i] = create_each_block_7(child_ctx);
    						each_blocks_7[i].c();
    						each_blocks_7[i].m(div22, null);
    					}
    				}

    				for (; i < each_blocks_7.length; i += 1) {
    					each_blocks_7[i].d(1);
    				}

    				each_blocks_7.length = each_value_7.length;
    			}

    			if (dirty & /*artist4*/ 16) {
    				each_value_6 = /*artist4*/ ctx[4];
    				validate_each_argument(each_value_6);
    				let i;

    				for (i = 0; i < each_value_6.length; i += 1) {
    					const child_ctx = get_each_context_6(ctx, each_value_6, i);

    					if (each_blocks_6[i]) {
    						each_blocks_6[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_6[i] = create_each_block_6(child_ctx);
    						each_blocks_6[i].c();
    						each_blocks_6[i].m(div28, null);
    					}
    				}

    				for (; i < each_blocks_6.length; i += 1) {
    					each_blocks_6[i].d(1);
    				}

    				each_blocks_6.length = each_value_6.length;
    			}

    			if (dirty & /*artist2*/ 4) {
    				each_value_5 = /*artist2*/ ctx[2];
    				validate_each_argument(each_value_5);
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5(ctx, each_value_5, i);

    					if (each_blocks_5[i]) {
    						each_blocks_5[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_5[i] = create_each_block_5(child_ctx);
    						each_blocks_5[i].c();
    						each_blocks_5[i].m(div34, null);
    					}
    				}

    				for (; i < each_blocks_5.length; i += 1) {
    					each_blocks_5[i].d(1);
    				}

    				each_blocks_5.length = each_value_5.length;
    			}

    			if (dirty & /*artist2*/ 4) {
    				each_value_4 = /*artist2*/ ctx[2];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks_4[i]) {
    						each_blocks_4[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_4[i] = create_each_block_4(child_ctx);
    						each_blocks_4[i].c();
    						each_blocks_4[i].m(div40, null);
    					}
    				}

    				for (; i < each_blocks_4.length; i += 1) {
    					each_blocks_4[i].d(1);
    				}

    				each_blocks_4.length = each_value_4.length;
    			}

    			if (dirty & /*artist2*/ 4) {
    				each_value_3 = /*artist2*/ ctx[2];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_3[i] = create_each_block_3(child_ctx);
    						each_blocks_3[i].c();
    						each_blocks_3[i].m(div46, null);
    					}
    				}

    				for (; i < each_blocks_3.length; i += 1) {
    					each_blocks_3[i].d(1);
    				}

    				each_blocks_3.length = each_value_3.length;
    			}

    			if (dirty & /*artist2*/ 4) {
    				each_value_2 = /*artist2*/ ctx[2];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(div48, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty & /*artist2*/ 4) {
    				each_value_1 = /*artist2*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div54, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*artist2*/ 4) {
    				each_value = /*artist2*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div55, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div57);
    			destroy_each(each_blocks_10, detaching);
    			destroy_each(each_blocks_9, detaching);
    			destroy_each(each_blocks_8, detaching);
    			destroy_each(each_blocks_7, detaching);
    			destroy_each(each_blocks_6, detaching);
    			destroy_each(each_blocks_5, detaching);
    			destroy_each(each_blocks_4, detaching);
    			destroy_each(each_blocks_3, detaching);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $currentMusic;
    	validate_store(currentMusic, 'currentMusic');
    	component_subscribe($$self, currentMusic, $$value => $$invalidate(6, $currentMusic = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MusicSection', slots, []);

    	let artists = [
    		{
    			name: 'Artist 1',
    			image: './images/artist1.jpg'
    		},
    		{
    			name: 'Artist 2',
    			image: '/images/artist2.jpg'
    		},
    		{
    			name: 'Artist 3',
    			image: '/images/artist3.jpg'
    		},
    		{
    			name: 'Artist 4',
    			image: '/images/artist4.jpg'
    		},
    		{
    			name: 'Artist 5',
    			image: '/images/artist5.jpg'
    		}
    	];

    	let artist2 = [
    		{
    			name: 'Artist 6',
    			image: './images/artist6.jpg'
    		},
    		{
    			name: 'Artist 7',
    			image: '/images/artist7.jpg'
    		},
    		{
    			name: 'Artist 8',
    			image: '/images/artist8.jpg'
    		},
    		{
    			name: 'Artist 9',
    			image: '/images/artist9.jpg'
    		},
    		{
    			name: 'Artist 10',
    			image: '/images/artist10.jpg'
    		}
    	];

    	let artist3 = [
    		{
    			name: 'Artist 6',
    			image: './images/artist6.jpg'
    		},
    		{
    			name: 'Artist 7',
    			image: '/images/artist7.jpg'
    		},
    		{
    			name: 'Artist 8',
    			image: '/images/artist8.jpg'
    		},
    		{
    			name: 'Artist 9',
    			image: '/images/artist9.jpg'
    		}
    	];

    	let artist4 = [
    		{
    			name: 'Artist 5',
    			image: '/images/artist5.jpg'
    		},
    		{
    			name: 'Artist 6',
    			image: './images/artist6.jpg'
    		},
    		{
    			name: 'Artist 7',
    			image: '/images/artist7.jpg'
    		},
    		{
    			name: 'Artist 8',
    			image: '/images/artist8.jpg'
    		},
    		{
    			name: 'Artist 9',
    			image: '/images/artist9.jpg'
    		},
    		{
    			name: 'Artist 10',
    			image: '/images/artist10.jpg'
    		}
    	];

    	let selectedArtist = null;

    	function selectArtist(artist) {
    		set_store_value(
    			currentMusic,
    			$currentMusic = {
    				ame: artist.name,
    				image: artist.image,
    				artist: artist.name,
    				isPlaying: true,
    				liked: false
    			},
    			$currentMusic
    		);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<MusicSection> was created with unknown prop '${key}'`);
    	});

    	const click_handler = artist => selectArtist(artist);

    	$$self.$capture_state = () => ({
    		MusicPlayer,
    		currentMusic,
    		artists,
    		artist2,
    		artist3,
    		artist4,
    		selectedArtist,
    		selectArtist,
    		$currentMusic
    	});

    	$$self.$inject_state = $$props => {
    		if ('artists' in $$props) $$invalidate(0, artists = $$props.artists);
    		if ('artist2' in $$props) $$invalidate(2, artist2 = $$props.artist2);
    		if ('artist3' in $$props) $$invalidate(3, artist3 = $$props.artist3);
    		if ('artist4' in $$props) $$invalidate(4, artist4 = $$props.artist4);
    		if ('selectedArtist' in $$props) selectedArtist = $$props.selectedArtist;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [artists, selectArtist, artist2, artist3, artist4, click_handler];
    }

    class MusicSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MusicSection",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\UserMenu.svelte generated by Svelte v3.59.2 */

    const file$1 = "src\\components\\UserMenu.svelte";

    // (183:2) {#if !isMobile}
    function create_if_block_2(ctx) {
    	let div2;
    	let div0;
    	let i0;
    	let t;
    	let div1;
    	let i1;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			i0 = element("i");
    			t = space();
    			div1 = element("div");
    			i1 = element("i");
    			attr_dev(i0, "class", "fas fa-chevron-left");
    			add_location(i0, file$1, 185, 8, 3444);
    			attr_dev(div0, "class", "nav-button svelte-11m9zb9");
    			add_location(div0, file$1, 184, 6, 3410);
    			attr_dev(i1, "class", "fas fa-chevron-right");
    			add_location(i1, file$1, 188, 8, 3535);
    			attr_dev(div1, "class", "nav-button svelte-11m9zb9");
    			add_location(div1, file$1, 187, 6, 3501);
    			attr_dev(div2, "class", "navigation-buttons svelte-11m9zb9");
    			add_location(div2, file$1, 183, 4, 3370);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, i0);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    			append_dev(div1, i1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(183:2) {#if !isMobile}",
    		ctx
    	});

    	return block;
    }

    // (195:4) {#if !isMobile}
    function create_if_block_1(ctx) {
    	let div2;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let span;
    	let t2;
    	let div1;
    	let i;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "Монгол улсын төрийн дуулал";
    			t2 = space();
    			div1 = element("div");
    			i = element("i");
    			if (!src_url_equal(img.src, img_src_value = "/images/Mongol.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Song Thumbnail");
    			attr_dev(img, "class", "svelte-11m9zb9");
    			add_location(img, file$1, 196, 8, 3703);
    			add_location(span, file$1, 198, 10, 3812);
    			attr_dev(div0, "class", "play-section-content svelte-11m9zb9");
    			add_location(div0, file$1, 197, 8, 3766);
    			attr_dev(i, "class", "fas fa-play");
    			add_location(i, file$1, 201, 10, 3912);
    			attr_dev(div1, "class", "play-icon svelte-11m9zb9");
    			add_location(div1, file$1, 200, 8, 3877);
    			attr_dev(div2, "class", "play-section svelte-11m9zb9");
    			add_location(div2, file$1, 195, 6, 3667);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, img);
    			append_dev(div2, t0);
    			append_dev(div2, div0);
    			append_dev(div0, span);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, i);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(195:4) {#if !isMobile}",
    		ctx
    	});

    	return block;
    }

    // (214:6) {#if !isMobile}
    function create_if_block$1(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*username*/ ctx[0]);
    			attr_dev(span, "class", "svelte-11m9zb9");
    			add_location(span, file$1, 214, 8, 4236);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*username*/ 1) set_data_dev(t, /*username*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(214:6) {#if !isMobile}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let link;
    	let t0;
    	let div5;
    	let t1;
    	let div4;
    	let t2;
    	let div0;
    	let i0;
    	let t3;
    	let div3;
    	let div1;
    	let img;
    	let img_src_value;
    	let t4;
    	let t5;
    	let div2;
    	let i1;
    	let if_block0 = !/*isMobile*/ ctx[2] && create_if_block_2(ctx);
    	let if_block1 = !/*isMobile*/ ctx[2] && create_if_block_1(ctx);
    	let if_block2 = !/*isMobile*/ ctx[2] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			div5 = element("div");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			div4 = element("div");
    			if (if_block1) if_block1.c();
    			t2 = space();
    			div0 = element("div");
    			i0 = element("i");
    			t3 = space();
    			div3 = element("div");
    			div1 = element("div");
    			img = element("img");
    			t4 = space();
    			if (if_block2) if_block2.c();
    			t5 = space();
    			div2 = element("div");
    			i1 = element("i");
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css");
    			add_location(link, file$1, 1, 2, 17);
    			attr_dev(i0, "class", "fas fa-bell");
    			add_location(i0, file$1, 207, 6, 4026);
    			attr_dev(div0, "class", "notification svelte-11m9zb9");
    			add_location(div0, file$1, 206, 4, 3992);
    			if (!src_url_equal(img.src, img_src_value = /*userAvatar*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "User Avatar");
    			attr_dev(img, "class", "svelte-11m9zb9");
    			add_location(img, file$1, 211, 8, 4147);
    			attr_dev(div1, "class", "user-avatar svelte-11m9zb9");
    			add_location(div1, file$1, 210, 6, 4112);
    			attr_dev(i1, "class", "fas fa-caret-down");
    			add_location(i1, file$1, 217, 8, 4317);
    			attr_dev(div2, "class", "dropdown-icon svelte-11m9zb9");
    			add_location(div2, file$1, 216, 6, 4280);
    			attr_dev(div3, "class", "user-avatar-wrapper svelte-11m9zb9");
    			add_location(div3, file$1, 209, 4, 4071);
    			attr_dev(div4, "class", "user-section svelte-11m9zb9");
    			add_location(div4, file$1, 193, 2, 3612);
    			attr_dev(div5, "class", "user-menu svelte-11m9zb9");
    			add_location(div5, file$1, 181, 0, 3322);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div5, anchor);
    			if (if_block0) if_block0.m(div5, null);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			if (if_block1) if_block1.m(div4, null);
    			append_dev(div4, t2);
    			append_dev(div4, div0);
    			append_dev(div0, i0);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, img);
    			append_dev(div3, t4);
    			if (if_block2) if_block2.m(div3, null);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, i1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*isMobile*/ ctx[2]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(div5, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (!/*isMobile*/ ctx[2]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(div4, t2);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*userAvatar*/ 2 && !src_url_equal(img.src, img_src_value = /*userAvatar*/ ctx[1])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!/*isMobile*/ ctx[2]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block$1(ctx);
    					if_block2.c();
    					if_block2.m(div3, t5);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div5);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('UserMenu', slots, []);
    	let { username = "Хэрэглэгч" } = $$props;
    	let { userAvatar = "/images/user.png" } = $$props;
    	let { isMobile = false } = $$props;
    	const writable_props = ['username', 'userAvatar', 'isMobile'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<UserMenu> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('username' in $$props) $$invalidate(0, username = $$props.username);
    		if ('userAvatar' in $$props) $$invalidate(1, userAvatar = $$props.userAvatar);
    		if ('isMobile' in $$props) $$invalidate(2, isMobile = $$props.isMobile);
    	};

    	$$self.$capture_state = () => ({ username, userAvatar, isMobile });

    	$$self.$inject_state = $$props => {
    		if ('username' in $$props) $$invalidate(0, username = $$props.username);
    		if ('userAvatar' in $$props) $$invalidate(1, userAvatar = $$props.userAvatar);
    		if ('isMobile' in $$props) $$invalidate(2, isMobile = $$props.isMobile);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [username, userAvatar, isMobile];
    }

    class UserMenu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { username: 0, userAvatar: 1, isMobile: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UserMenu",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get username() {
    		throw new Error("<UserMenu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set username(value) {
    		throw new Error("<UserMenu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get userAvatar() {
    		throw new Error("<UserMenu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userAvatar(value) {
    		throw new Error("<UserMenu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isMobile() {
    		throw new Error("<UserMenu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isMobile(value) {
    		throw new Error("<UserMenu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.59.2 */
    const file = "src\\App.svelte";

    // (153:0) {:else}
    function create_else_block(ctx) {
    	let div2;
    	let sidebar;
    	let t0;
    	let div1;
    	let div0;
    	let usermenu;
    	let t1;
    	let musicsection;
    	let t2;
    	let musicplayer;
    	let current;

    	sidebar = new Sidebar({
    			props: { isMobile: /*isMobile*/ ctx[0] },
    			$$inline: true
    		});

    	usermenu = new UserMenu({
    			props: { isMobile: /*isMobile*/ ctx[0] },
    			$$inline: true
    		});

    	musicsection = new MusicSection({
    			props: { isMobile: /*isMobile*/ ctx[0] },
    			$$inline: true
    		});

    	musicplayer = new MusicPlayer({
    			props: { isMobile: /*isMobile*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			create_component(sidebar.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");
    			create_component(usermenu.$$.fragment);
    			t1 = space();
    			create_component(musicsection.$$.fragment);
    			t2 = space();
    			create_component(musicplayer.$$.fragment);
    			attr_dev(div0, "class", "header svelte-110gd8f");
    			add_location(div0, file, 157, 6, 2993);
    			attr_dev(div1, "class", "content svelte-110gd8f");
    			add_location(div1, file, 156, 4, 2965);
    			attr_dev(div2, "class", "container svelte-110gd8f");
    			add_location(div2, file, 154, 2, 2910);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			mount_component(sidebar, div2, null);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			mount_component(usermenu, div0, null);
    			append_dev(div1, t1);
    			mount_component(musicsection, div1, null);
    			append_dev(div2, t2);
    			mount_component(musicplayer, div2, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const sidebar_changes = {};
    			if (dirty & /*isMobile*/ 1) sidebar_changes.isMobile = /*isMobile*/ ctx[0];
    			sidebar.$set(sidebar_changes);
    			const usermenu_changes = {};
    			if (dirty & /*isMobile*/ 1) usermenu_changes.isMobile = /*isMobile*/ ctx[0];
    			usermenu.$set(usermenu_changes);
    			const musicsection_changes = {};
    			if (dirty & /*isMobile*/ 1) musicsection_changes.isMobile = /*isMobile*/ ctx[0];
    			musicsection.$set(musicsection_changes);
    			const musicplayer_changes = {};
    			if (dirty & /*isMobile*/ 1) musicplayer_changes.isMobile = /*isMobile*/ ctx[0];
    			musicplayer.$set(musicplayer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);
    			transition_in(usermenu.$$.fragment, local);
    			transition_in(musicsection.$$.fragment, local);
    			transition_in(musicplayer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			transition_out(usermenu.$$.fragment, local);
    			transition_out(musicsection.$$.fragment, local);
    			transition_out(musicplayer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(sidebar);
    			destroy_component(usermenu);
    			destroy_component(musicsection);
    			destroy_component(musicplayer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(153:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (130:2) {#if isMobile}
    function create_if_block(ctx) {
    	let div1;
    	let button;
    	let i;
    	let t0;
    	let img;
    	let img_src_value;
    	let t1;
    	let div0;
    	let usermenu;
    	let t2;
    	let div2;
    	let t3;
    	let div3;
    	let sidebar;
    	let t4;
    	let div4;
    	let musicsection;
    	let t5;
    	let musicplayer;
    	let current;
    	let mounted;
    	let dispose;

    	usermenu = new UserMenu({
    			props: { isMobile: /*isMobile*/ ctx[0] },
    			$$inline: true
    		});

    	sidebar = new Sidebar({
    			props: { isMobile: /*isMobile*/ ctx[0] },
    			$$inline: true
    		});

    	musicsection = new MusicSection({
    			props: { isMobile: /*isMobile*/ ctx[0] },
    			$$inline: true
    		});

    	musicplayer = new MusicPlayer({
    			props: { isMobile: /*isMobile*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			button = element("button");
    			i = element("i");
    			t0 = space();
    			img = element("img");
    			t1 = space();
    			div0 = element("div");
    			create_component(usermenu.$$.fragment);
    			t2 = space();
    			div2 = element("div");
    			t3 = space();
    			div3 = element("div");
    			create_component(sidebar.$$.fragment);
    			t4 = space();
    			div4 = element("div");
    			create_component(musicsection.$$.fragment);
    			t5 = space();
    			create_component(musicplayer.$$.fragment);
    			attr_dev(i, "class", "fas fa-bars");
    			add_location(i, file, 133, 6, 2352);
    			attr_dev(button, "class", "menu-button svelte-110gd8f");
    			add_location(button, file, 132, 4, 2292);
    			if (!src_url_equal(img.src, img_src_value = "./images/logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Logo");
    			attr_dev(img, "class", "mobile-logo svelte-110gd8f");
    			add_location(img, file, 135, 4, 2398);
    			attr_dev(div0, "class", "user-controls");
    			add_location(div0, file, 136, 4, 2465);
    			attr_dev(div1, "class", "mobile-header svelte-110gd8f");
    			add_location(div1, file, 131, 2, 2260);
    			attr_dev(div2, "class", "sidebar-overlay svelte-110gd8f");
    			toggle_class(div2, "open", /*isSidebarOpen*/ ctx[1]);
    			add_location(div2, file, 142, 2, 2578);
    			attr_dev(div3, "class", "sidebar");
    			toggle_class(div3, "open", /*isSidebarOpen*/ ctx[1]);
    			add_location(div3, file, 143, 2, 2684);
    			attr_dev(div4, "class", "mobile-container svelte-110gd8f");
    			add_location(div4, file, 147, 2, 2772);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button);
    			append_dev(button, i);
    			append_dev(div1, t0);
    			append_dev(div1, img);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			mount_component(usermenu, div0, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div3, anchor);
    			mount_component(sidebar, div3, null);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div4, anchor);
    			mount_component(musicsection, div4, null);
    			insert_dev(target, t5, anchor);
    			mount_component(musicplayer, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*toggleSidebar*/ ctx[2], false, false, false, false),
    					listen_dev(div2, "click", /*click_handler*/ ctx[3], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const usermenu_changes = {};
    			if (dirty & /*isMobile*/ 1) usermenu_changes.isMobile = /*isMobile*/ ctx[0];
    			usermenu.$set(usermenu_changes);

    			if (!current || dirty & /*isSidebarOpen*/ 2) {
    				toggle_class(div2, "open", /*isSidebarOpen*/ ctx[1]);
    			}

    			const sidebar_changes = {};
    			if (dirty & /*isMobile*/ 1) sidebar_changes.isMobile = /*isMobile*/ ctx[0];
    			sidebar.$set(sidebar_changes);

    			if (!current || dirty & /*isSidebarOpen*/ 2) {
    				toggle_class(div3, "open", /*isSidebarOpen*/ ctx[1]);
    			}

    			const musicsection_changes = {};
    			if (dirty & /*isMobile*/ 1) musicsection_changes.isMobile = /*isMobile*/ ctx[0];
    			musicsection.$set(musicsection_changes);
    			const musicplayer_changes = {};
    			if (dirty & /*isMobile*/ 1) musicplayer_changes.isMobile = /*isMobile*/ ctx[0];
    			musicplayer.$set(musicplayer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(usermenu.$$.fragment, local);
    			transition_in(sidebar.$$.fragment, local);
    			transition_in(musicsection.$$.fragment, local);
    			transition_in(musicplayer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(usermenu.$$.fragment, local);
    			transition_out(sidebar.$$.fragment, local);
    			transition_out(musicsection.$$.fragment, local);
    			transition_out(musicplayer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(usermenu);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div3);
    			destroy_component(sidebar);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div4);
    			destroy_component(musicsection);
    			if (detaching) detach_dev(t5);
    			destroy_component(musicplayer, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(130:2) {#if isMobile}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let t;
    	let link;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*isMobile*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			t = space();
    			link = element("link");
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css");
    			add_location(link, file, 167, 1, 3170);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, t, anchor);
    			append_dev(document.head, link);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(t.parentNode, t);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(t);
    			detach_dev(link);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let isMobile = false;
    	let isSidebarOpen = false;

    	onMount(() => {
    		const checkMobile = () => {
    			$$invalidate(0, isMobile = window.innerWidth <= 768);
    		};

    		checkMobile();
    		window.addEventListener('resize', checkMobile);
    		return () => window.removeEventListener('resize', checkMobile);
    	});

    	const toggleSidebar = () => {
    		$$invalidate(1, isSidebarOpen = !isSidebarOpen);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(1, isSidebarOpen = false);

    	$$self.$capture_state = () => ({
    		Sidebar,
    		MusicSection,
    		UserMenu,
    		MusicPlayer,
    		onMount,
    		isMobile,
    		isSidebarOpen,
    		toggleSidebar
    	});

    	$$self.$inject_state = $$props => {
    		if ('isMobile' in $$props) $$invalidate(0, isMobile = $$props.isMobile);
    		if ('isSidebarOpen' in $$props) $$invalidate(1, isSidebarOpen = $$props.isSidebarOpen);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [isMobile, isSidebarOpen, toggleSidebar, click_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
      props: { }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
