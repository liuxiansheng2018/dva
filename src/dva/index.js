
import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { connect, Provider } from 'react-redux';
import { createHashHistory } from 'history'
import createSagaMiddleware from 'redux-saga';
import * as sagaEffects from 'redux-saga/effects';
import { NAMESPACE_SEP } from './constant'
import { routerMiddleware, connectRouter, ConnectedRouter } from 'connected-react-router'
//plugin
import Plugin, { filterHooks } from './plugins'
export { connect }
export default function (opts = {}) {
    let history = opts.history || createHashHistory()

    let app = {
        _history: history,
        _models: [],
        model,
        _router: null,
        router,
        start,
    }

    function model(model) {
        let prefixedModel = prefixNamespace(model) //添加命名空间的前缀
        app._models.push(prefixedModel);
        return prefixedModel

    }

    function router(routerConfig) {
        app._router = routerConfig;
    }

    //这个对象是要传给combineReducer的， 用来合并， 每个属性都是字符串， 而且代表合并状态的一个分状态属性
    let initialReducer = {
        //当页面路径发生改变的时候， 会向仓库派发动作， 仓库状态发生改变
        router: connectRouter(app._history)
    }

    let plugin = new Plugin()
    plugin.use(filterHooks(opts))
    app.use = plugin.use.bind(plugin)
    function start(container) {
        for (const model of app._models) {
            initialReducer[model.namespace] = getReducer(model)
        }
        let rootReucer = createReducer() //返回一个根的 reducer
        // let reducers = getReducers(app);
        let sagas = getSagas(app);
        let sagaMiddleware = createSagaMiddleware();

        //让我们中件间生效
        const extraMiddleWare = plugin.get('onAction')

        app._store = applyMiddleware(routerMiddleware(history), sagaMiddleware, ...extraMiddleWare)(createStore)(rootReucer, opts.initialState)

        let onStateChange = plugin.get('onStateChange')
        //每当状态发生变化之后会去执行， 用来做序列化
        app._store.subscribe(() => {
            onStateChange.forEach(listener => listener(app._store.getState()))
        })

        //对subscriptions执行逻辑 对应的源代码逻辑
        for (const model of app._models) {
            if (model.subscriptions) {
                runSubscription(model.subscriptions)
                // for( let key in model.subscriptions ) {
                //     let subscription = model.subscriptions[key]
                //     subscription({history, dispatch: app._store.dispatch})
                // }
            }
        }
        sagas.forEach(sagaMiddleware.run); //run 就是启动saga执行
        // app._store = createStore(store)
        ReactDOM.render(
            <Provider store={app._store}>
                {/* <ConnectedRouter history={history}> */}
                {app._router({ history })}
                {/* </ConnectedRouter> */}
            </Provider>, document.querySelector(container))

        //实现dva/dynamic 懒加载的方法, 为当前应用插入一个模型 store, reducer subscriptions effects
        app.model = injectModel.bind(app)
        function injectModel(m) {
            m = model(m) //给reducer 和 effect 名字添加命名空间前缀
            initialReducer[m.namespace] = getReducer(m)
            app._store.replaceReducer(createReducer()) //用新的reducer 替换老得reducer
            if (m.effects) {
                sagaMiddleware.run(getSaga(m.effects, m)) //启动saga
            }
            if (m.subscriptions) {
                runSubscription(m.subscriptions)
            }
        }

        // 
        function createReducer() {
            let reducerEnhance = plugin.get('onReducer')
            let extraReducers = plugin.get('extraReducers')
            return combineReducers({
                ...initialReducer,
                ...extraReducers
            })
        }

        //整和 一开始的saga 和 懒加载中的saga
        function runSubscription(subscriptions) {
            for (let key in subscriptions) {
                let subscription = subscriptions[key]
                subscription({ history, dispatch: app._store.dispatch })
            }
        }

        // 添加所有模型的saga
        function getSagas(app) {
            let sagas = [];
            for (const model of app._models) {
                //把一个effects 转换成一个saga 
                sagas.push(getSaga(model.effects, model, plugin.get('onEffect')))
            }
            return sagas
        }
        //获取某个saga
        function getSaga(effects, model) {
            return function* () {
                for (const key in model.effects) {
                    const watcher = getWatcher(key, model.effects[key], model, plugin.get('onEffect'))
                    //为什么调用fork, 是因为fork 不可单独开一个进程去执行， 而不是阻塞当前的saga的执行
                    const task = yield sagaEffects.fork(watcher)
                    yield sagaEffects.fork(function* () {
                        yield sagaEffects.take(`${model.namespace}/@@CANCEL_EFFECTS`)
                        yield sagaEffects.cancel(task)
                    })
                }
            }
        }

    }
    return app
}

function getReducer(model) {
    let { reducers = {}, state: defaultState } = model
    return function (state = defaultState, action) {
        let reducer = reducers[action.type]
        if (reducer) {
            return reducer(state, action)
        }
        return state
    }
}


//跟redux 类似， 这一函数就是吧各种 model里面的reducers对象转换成一个管理自己函数的reduce函数 进行合并
function getReducers(app) {
    let reducers = {
        //当页面路径发生改变的时候， 会向仓库派发动作， 仓库状态发生改变
        router: connectRouter(app._history)
    }
    for (const model of app._models) {
        reducers[model.namespace] = function (state, action) {
            let model_reducers = model.reducers || {}
            let reducer = model_reducers[action.type]
            if (reducer) {
                return reducer(state, action)
            }
            return state
        }
    }
    return combineReducers(reducers)
}


// function reducer(state={number: 0}, actions) {
//     if( actions.type === 'counter/add' ) {
//         return add(state, actions)
//     } else if( actions.type === 'counter/minus' ) {
//         return minus(state, actions)
//     } else {
//         return 
//     }
// }



/**
 * store.dispatch({type: 'counter/add'})
 * {
 *  counter1: function (state, actions)
 *  counter2: function (state, actions)
 * }
 * 
 * 
 */


//目的就是把 effects 转换成一个saga
// function getSagas (app) {
//     let sagas = [];
//     for( const model of app._models ) {
//         //把一个effects 转换成一个saga 
//         sagas.push( function* () {
//             for( const key in model.effects ) { 
//                 const watcher = getWatcher(key, model.effects[key], model, plugin.get('onEffect')) 
//                 //为什么调用fork, 是因为fork 不可单独开一个进程去执行， 而不是阻塞当前的saga的执行
//                 yield sagaEffects.fork(watcher)
//             }
//         })
//     }
//     return sagas
// }

function prefixNamespace(model) {
    if (model.reducers) {
        model.reducers = prefix(model.reducers, model.namespace)
    }
    if (model.effects) {
        model.effects = prefix(model.effects, model.namespace)
    }
    return model
}

//此方法就是把reducers对象的属性名从add 变成 counter/add
function prefix(obj, namespace) {
    // let reducers = obj
    //Object.keys(reducers) ['add', 'minus]
    return Object.keys(obj).reduce((memo, key) => {
        let newKey = `${namespace}${NAMESPACE_SEP}${key}`
        memo[newKey] = obj[key]
        return memo
    }, {})
}


function prefixType(type, model) {
    if (type.indexOf('/') == -1) {
        return `${model.namespace}${NAMESPACE_SEP}${type}`
    } else {
        if (type.startsWith(model.namespace)) {
            console.error('你不需要加这个命名空间前缀')
        }
    }
    return type
}
//订阅模式， 订阅方式是否被调用
function getWatcher(key, effect, model, onEffect) {
    function put(action) {
        return sagaEffects.put({ ...action, type: prefixType(action.type, model) })
    }
    return function* () {
        if (onEffect) {
            for (const fn of onEffect) {
                effect = fn(effect, { ...sagaEffects, put }, model, key)
            }
        }
        yield sagaEffects.takeEvery(key, function* (...args) {

            yield effect(...args, { ...sagaEffects, put })
        })
    }
}
