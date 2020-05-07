import {delay} from '../utils'
export default {
    namespace: 'users',
    state: {
        list: [
            {id: 1, name: '珠峰'},
            {id: 2, name: '架构'}
        ]
    },

    reducers: {
        add(state, action) {
            return {
                list: [
                    ...state.list,
                    {id: state.list.length+1, name: action.payload}
                ]
            }
        }
    },
    effects: {
        *asyncAdd(action, {put, call}) {
            yield call(delay, 1000)
            yield put({type: 'add', payload: '学院'})
        }
    }
}