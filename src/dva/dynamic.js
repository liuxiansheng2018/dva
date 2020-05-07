import React from 'react'
const DefaultLoadingComponent = props => <div>加载中</div>
export default function dynamic (config) {
    let {app, models, component} = config
    // hookFunction 高阶组件
    return class extends React.Component {
        constructor( props ) {
            super(props) 
            //加载组件， 当加载中起作用
            this.LoadingComponent = config.LoadingComponent || DefaultLoadingComponent
            this.state = {
                AsyncComponent: null
            }
        }

       async componentDidMount () {
           //进行解构
          let [resolvedModules, AsyncComponent] = await Promise.all([Promise.all(models()), component()]);
         
          resolvedModules =  resolvedModules.map ( m => m.default || m );
          AsyncComponent = AsyncComponent.default || AsyncComponent;
          resolvedModules.forEach(m => app.model(m));
          this.setState({AsyncComponent});
        }

        render () {
            let {AsyncComponent}  = this.state
            let {LoadingComponent} = this
            return (
                AsyncComponent ?  <AsyncComponent {...this.props} /> : <LoadingComponent />    
               
            )
           
        }

    }
}