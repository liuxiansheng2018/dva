const SHOW = '@@DVA_LOADING/SHOW';  //当saga 执行之前派发的动作
const HIDE = '@@DVA_LOADING/HIDE';  //当saga 执行之后派发的动作
const NAMESPACE = 'loading';    //命名空间

export default function createLoading (options) {
    let initailState = {
        global: false,
        models: {},
        effects: {}
    }

    const extraReducers = {  
        [NAMESPACE](state=initailState, {type, payload}) {
            let {namespace, actionType} = payload || {};
            let ret;
            switch (type) {
                case SHOW:
                    return {
                        ...state,
                        global: true,
                        models: {
                            ...state.models, [namespace]: true
                        },
                        effects: {
                            ...state.effects,
                            [actionType]: true
                        }
                    }
                case HIDE:  
                    let effects = {...state.effects, [actionType]: false} 
                    let models = {
                        ...state.models,
                        [namespace]: Object.keys(effects).some( actionType=>  {
                            const _namespace = actionType.split('/')[0]
                            if( _namespace !== namespace ) {
                                return false
                            }
                            return effects[actionType]
                        })
                    }
                    let global = Object.keys(models).some(namespace => {
                        return models[namespace]
                    })
                    return {
                        effects,
                        models,
                        global
                    }
                default:
                    return state
            }
        }
    }

    //sage effect put 派发动作 model 当前模型 actionType 代表动作的类型
    function onEffect(effect, {put}, model, actionType) {
        const {namespace} = model //counter
        return function* (...args) {
            try {
                yield put({type: SHOW, payload: {namespace: actionType}})
                yield effect(...args)
            } finally {
                yield put({type: HIDE, payload: {namespace, actionType}})
            }
        }
    }

    return {
        onEffect,
        extraReducers 
    }

}
    