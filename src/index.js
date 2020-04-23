import React from 'react'

import dva, {connect} from 'dva' 

//试试自己手写的dva
// import dva, {connect} from './dva'
import {createBrowserHistory} from 'history'

//手写Router
import {Router,Route, Link, routerRedux} from './dva/router'


function delay(ms) {
    return new Promise((resolve,reject) => {
        setTimeout(function () {
            resolve();
        },ms);
    });
 }


let app = dva({
    history: createBrowserHistory() //从hash 路由变为浏览器路由
})
app.model({
    namespace:'counter1',
    state:{number:0},
    reducers:{
        add(state){
            return {number:state.number+1};
        },
        minus(state){
            return {number:state.number-1};
        }
    },
    effects: {
        //我要监听counter/asyncAdd的动作， 监听到之后执行这个saga takeEvent('counter/asyncAdd', *asyncAdd(action, effects){})
        *asyncAdd(action,{call,put}){
            yield call(delay,1000);
            yield put({type:'add'});
        },
        *asyncMinus(action,{call,put}){
            yield call(delay,1000);
            yield put({type:'minus'});
        }
    },
    subscriptions: {
        changeTitle ({history, dispatch}) {
            history.listen( (location) => {
                document.title = location.pathname
                dispatch({type: 'counter1/add'})
            })
        }
    }
})

app.model({
    namespace:'counter2',
    state:{number:0},
    reducers:{
        add(state){
            return {number:state.number+1};
        },
        minus(state){
            return {number:state.number-1};
        }
    },
    effects: {
        //我要监听counter/asyncAdd的动作， 监听到之后执行这个saga takeEvent('counter/asyncAdd', *asyncAdd(action, effects){})
        *asyncAdd(action,{call,put}){
            yield call(delay,1000);
            yield put({type:'add'});
        },
        *asyncMinus(action,{call,put}){
            yield call(delay,1000);
            yield put({type:'minus'});
        }
    }
})



function Counter1(props) {
    return (
        <div>
            <p>{props.number}</p>
            <button onClick={()=> props.dispatch({type: 'counter1/add'})}>+</button>
            <button onClick={()=> props.dispatch(routerRedux.push('/counter2'))}>reduxRedux</button>
            <button onClick={()=> props.dispatch({type: 'counter1/asyncAdd'})}>asyncAdd</button>
            <button onClick={()=> props.dispatch({type: 'counter1/asyncMinus'})}>minus</button>
        </div>
    )
}

let ConnectCounter1 = connect(state=> state.counter1)(Counter1)

function Counter2(props) {
    return (
        <div>
            <p>{props.number}</p>
            <button onClick={()=> props.dispatch({type: 'counter2/add'})}>+</button>
            <button onClick={()=> props.dispatch({type: 'counter2/asyncAdd'})}>asyncAdd</button>
            <button onClick={()=> props.dispatch({type: 'counter2/asyncMinus'})}>minus</button>
        </div>
    )
}
let ConnectCounter2 = connect(state=> state.counter2)(Counter2)

app.router(({history, app})=>(
    <Router history={history}>
        <>
            <ul>
                <Link to="/counter">counter1</Link>
            </ul>
            <Route path="/counter" component={ConnectCounter1} />
            {/* <Route path="/counter2" component={ConnectCounter2} /> */}
        </>
     </Router>
  
))
app.start('#root')


