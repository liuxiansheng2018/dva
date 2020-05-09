const UNDO = 'UNDO'
const REDO = 'REDO'

export default function (reducer) {
    let initialState = {
        past: [],       //历史
        present: reducer(undefined, {}), //当前
        future: []      //未来
    }
    return function (state = initialState, action) {
        const { past, present, future } = state
        switch (action.type) {
            // [1,2] 3 [4,5,6]
            //回退 ， 把历史里最新的当作当前的， 历史减少一个， 当前成为未来的第一个
            case UNDO:
                if (past.length > 0) {
                    return {
                        present: past.pop(),
                        past,
                        future: [present, ...future]
                    }
                }

            case REDO:
                if (future.length > 0) {
                    return {
                        present: past.shift(),
                        past: [...past, present],
                        future
                    }
                }


            default:
                const newPresent = reducer(present, action)
                return {
                    past: [...past, present],
                    present: newPresent,
                    future: []
                }
        }
    }
}

export const ActionCreators = {
    undo() {
        return { type: UNDO }
    },
    redo() {
        return { type: REDO }
    }
}