import React from 'react'

// import dva, {connect} from 'dva' 

//试试自己手写的dva
import dva, {connect} from './dva'
import createBrowserHistory from 'history'
import createLogger from './dva/redux-logger'
//手写Router
import {Router,Route, Link, routerRedux} from './dva/router'
// 使用dva-loading
import createLoading from './dva-loading'
//懒加载
import dynamic from './dva/dynamic'

function delay(ms=1000) {
    return new Promise((resolve,reject) => {
        setTimeout(function () {
            resolve();
        },ms);
    });
 }

 let app = dva({})
app.use({onAction: createLogger}) 
 app.use(createLoading())
// let app = dva({
//     history: createBrowserHistory() //从hash 路由变为浏览器路由
// })
//use 是使用插件的意思 或者说是钩子
// app.use(createLoading())

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
        }
    },
    subscriptions: {
        changeTitle ({history, dispatch}) {
            history.listen( (location) => {
                document.title = location.pathname
                // dispatch({type: 'add'})
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

window.app = app

function Counter1(props) {
    return (
        <div>
            <p>{props.number}</p>
            <button onClick={()=> props.dispatch({type: 'counter1/add'})}>+</button>
            <button onClick={()=> props.dispatch(routerRedux.push('/counter2'))}>reduxRedux   </button>
            <button onClick={()=> props.dispatch({type: 'counter1/asyncAdd'})}>asyncAdd</button>
            <button onClick={()=> props.dispatch({type: 'counter1/asyncMinus'})}>minus</button>
        </div>
    )
}

let ConnectCounter1 = connect(state=> state.counter1)(Counter1)


const UserPage = dynamic({
       app,
       /*   写法一
       models: () => [
           import('./models/users'),
       ],
       component: () => import('./routes/UserPage'),
       */

       //写法二， 把两个chunk 合并成一个chunk
       models: () => [import(/* webpackChunkName: "users" */ './models/users')],
       component: () => import(/* webpackChunkName: "users" */ './routes/UserPage')

})

function Counter2(props) {
    console.log(props, "props")
    return (
        <div>
           <p>home</p>
            <button onClick={()=> props.dispatch(routerRedux.push('/'))}>跳转到/counter</button>
            <button onClick={()=> props.dispatch({type: 'counter1/asyncAdd'})}>minus</button>
        </div>
    )
}
let ConnectCounter2 = connect(
    state=> ({
        ...state.counter1,
        loading: state.loading.models
    })
)(Counter2)

app.router(({history, app})=>(
    <Router history={history}>
        <>
            <ul>
                <Link to="/">home</Link>
                <br></ br>
                <Link to="/counter2">counter2</Link>
                <br></ br>
                <Link to="/users">users</Link>
            </ul>
            <Route path="/" exact component={ConnectCounter1} />
            <Route path="/counter2" component={ConnectCounter2} />
            <Route path="/users" component={UserPage} />
        </>
     </Router>
  
))
app.start('#root')


