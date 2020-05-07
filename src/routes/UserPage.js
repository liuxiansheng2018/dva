import React from 'react'
import {connect} from '../dva'

function UserPages (props) {
    let {list = []} = props
    return (
        <>
            <button onClick={ ()=> props.dispatch({type: 'users/asyncAdd'}) }>添加用户</button>
            <ul>
                {
                    list.map( (item)=> <li key={item.id}>{item.name}</li>)
                }
                
            </ul>
            
        </>
    )
}

export default connect(state => state.users)(UserPages);