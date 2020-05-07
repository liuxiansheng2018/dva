import React from 'react'

const colors = {
    prevState: '#9E9E9E',
    action: '#03A9F4',
    nextState: '#4cAF50'
}

const logger = ({dispatch, getState}) => next => action => {
    let startTime = Date.now()
    let prevState = getState()  //通过这个属性获取我们的老状态
    let returnValue = next(action)  //往下执行获取新的状态
    let nextState = getState()  //获取执行完后中新状态

    console.group(`%caction %c${action.type} %c@${new Date().toLocaleDateString()}`,
        `color: gray; font-weight: lighter`,
        `color: inherit; font-weight: bold`,
        `color: gray; font-weight: lighter`
    )
    console.log(`%cprev state`, `color: ${colors.prevState}; font-weight: lighter`, prevState )
    console.log(`%caction`, `color: ${colors.action}; font-weight: lighter`, action )
    console.log(`%cnext state`, `color: ${colors.nextState}; font-weight: lighter`, nextState )
    console.groupEnd()

}

export default logger