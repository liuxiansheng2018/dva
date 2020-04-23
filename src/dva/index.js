
import React from 'react';
import ReactDOM from 'react-dom';
import {createStore,combineReducers,applyMiddleware} from 'redux';
import {connect,Provider} from 'react-redux';
import {createHashHistory} from 'history'
import createSagaMiddleware from 'redux-saga';
import * as sagaEffects from 'redux-saga/effects';
import { NAMESPACE_SEP } from './constant'
import {routerMiddleware, connectRouter, ConnectedRouter} from  'connected-react-router'
export {connect}
export default function (opts= {}) {
    let history = opts.history || createHashHistory()

    let app = {
        _history: history,
        _models: [],
        model,
        _router: null,
        router,
        start,
    }

    function model(model){
        let prefixedModel = prefixNamespace(model) //添加命名空间的前缀
        app._models.push(prefixedModel);
        return prefixedModel
        
    }

    function router(routerConfig){
        app._router = routerConfig;
    } 

    //这个对象是要传给combineReducer的， 用来合并， 每个属性都是字符串， 而且代表合并状态的一个分状态属性
    let initialReducer = {
        //当页面路径发生改变的时候， 会向仓库派发动作， 仓库状态发生改变
        router: connectRouter(app._history)
    }

    function start (container) {
        for( const model of app._models ) {
            initialReducer[model.namespace] = getReducer(model)
        }
        let rootReucer = createReducer() //返回一个根的 reducer
        // let reducers = getReducers(app);
        let sagas = getSagas(app);
        let sagaMiddleware = createSagaMiddleware();
        app._store = applyMiddleware(routerMiddleware(history),sagaMiddleware)(createStore)(rootReucer)

        //对subscriptions执行逻辑 对应的源代码逻辑
        for(const model of aoo._models) {
            if( model.subscriptions ) {
                for( let key in model.subscriptions ) {
                    let subscription = model.subscription[key]
                    subscription({history, dispatch: app._store.dispatch})
                }
            }
        }
        sagas.forEach(sagaMiddleware.run); //run 就是启动saga执行
        // app._store = createStore(store)
        ReactDOM.render( 
           <Provider store={app._store}> 
                <ConnectedRouter history={history}>
                    {app._router({history, history})}
                </ConnectedRouter>     
           </Provider>,document.querySelector(container))
           function createReducer() {
               return combineReducers({
                   ...initialReducer
               })
           }
           
    }
    return app
}

function getReducer (model) {
    let {reducers= {}, state: defaultState} = model
    return function (state=defaultState, action) { 
        let reducer = reducers[action.type]
        if( reducer ) { 
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
    for( const model of app._models ) {
         reducers[model.namespace] = function (state=m , action) {
             let model_reducers = model.reducers || {}
             let reducer = model_reducers[action.type]
             if( reducer ) {
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
function getSagas (app) {
    let sagas = [];
    for( const model of app._models ) {
        //把一个effects 转换成一个saga 
        sagas.push( function* () {
            for( const key in model.effects ) { 
                const watcher = getWatcher(key, model.effects[key], model)
                //为什么调用fork, 是因为fork 不可单独开一个进程去执行， 而不是阻塞当前的saga的执行
                yield sagaEffects.fork(watcher)
            }
        })
    }
    return sagas
}

function prefixNamespace (model) {
    if( model.reducers ) {
        model.reducers = prefix(model.reducers, model.namespace)
    } 
    if( model.effects ) {
        model.effects = prefix(model.effects, model.namespace)
    }
    return model
}

 //此方法就是把reducers对象的属性名从add 变成 counter/add
 function prefix (obj, namespace) {
    // let reducers = obj
    //Object.keys(reducers) ['add', 'minus]
  return Object.keys(obj).reduce( (memo, key)=> {
        let newKey = `${namespace}${NAMESPACE_SEP}${key}`
        memo[newKey] = obj[key]
        return memo
    },{})
 }


function prefixType (type, model) {
    console.log(type, "As")
    if( type.indexOf('/') == -1 ) {
        return `${model.namespace}${NAMESPACE_SEP}${type}`
    } else {
        if(type.startsWith(model.namespace)) {
            console.error('你不需要加这个命名空间前缀')
        }
    }
    return type
}
//订阅模式， 订阅方式是否被调用
function getWatcher (key, effect, model) {
    function put(action) {
        return sagaEffects.put({...action, type: prefixType(action.type, model)})
    }
    return function* () {
        yield sagaEffects.takeEvery(key, function* (...args) {
            yield effect(...args, {...sagaEffects, put} )
        })
    }
}
