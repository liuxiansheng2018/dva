 

const hooks = [
    'onEffect', //用来增强effect
    'extraReducers',    //添加额外的reducers
    "onAction"
]

/**
 * 把哪些不是hooks的属性给去掉
 * @param {*} options 
 */

 export function filterHooks (options) {
    return Object.keys(options).reduce( (memo, key)=> {
        if( hooks.indexOf(key) > -1 ) {
            memo[key] = options[key]
        }
        return memo
    },{})
 }

 export default class Plugin {
    constructor() {
        //this.hooks =  {onEffect: [], extractReducer: []}
        this.hooks = hooks.reduce( (memo, key)=> {
            memo[key] = [];
            return memo
        }, {})
    }
    //插件就是一个对象， 它的属性就是一个钩子函数
    //use接受钩子函数， 然后缓存在当前实例 hooks属性上
    use (plugin) {  //pligin = { onAction: createLogger() }
        const {hooks} = this
        for( let key in plugin ) { 
            hooks[key].push(plugin[key])
        }
    }
    get (key) {
        const {hooks} = this
        if( key === 'extraReducers' ) {
            return getExtraReducers(hooks[key])
        } else {
            return hooks[key]  //数组[{key1: reducer1, key2: reducer2}]
        }  
    }
 }

 function getExtraReducers (hook) {
    let ret = {};
    for( let rducerObject of hook ) {
        ret = {...ret, ...rducerObject}
    }
    return ret
 }