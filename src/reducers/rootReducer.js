const initState = {
    user_id : "",
    username : "",
    game_id : "",
    players : [],
    player_names : [],
    player_swapped : [],
    player_num_cards : [],
    deck : 0,
    played_pile : [],
    discard_pile : [],
    hand : [],
    untouched_hand : [],
    hidden_hand : [],
    playable_cards : [],
    turn_at : "",
    messages : []
}

const rootReducer = (state = initState, action) => {
    if (action.type === 'UPDATE_STATE') {
        return {
            ...state,
            players : action.gameState.players,
            player_swapped : action.gameState.players.map(({swapped}) => {return swapped}),
            player_num_cards : action.gameState.players.map(({num_hand_cards}) => {return num_hand_cards}),
            deck : action.gameState.deck,
            played_pile : action.gameState.played_pile,
            discard_pile : action.gameState.discard_pile,
            hand : action.gameState.hand,
            untouched_hand : action.gameState.untouched_hand,
            hidden_hand : action.gameState.hidden_hand,
            playable_cards : action.gameState.playable_cards,
            turn_at : action.gameState.turn_at
        }
    } else if (action.type === 'UPDATE_MESSAGES') {
        return {
            ...state,
            messages : action.messages
        }
    } else if (action.type === 'UPDATE_GAME_ID') {
        return {
            ...state,
            game_id : action.game_id
        }
    } else if (action.type === 'UPDATE_USERNAME') {
        return {
            ...state,
            username : action.username
        }
    } else if (action.type === 'UPDATE_PLAYER_NAMES') {
        return {
            ...state,
            player_names : action.player_names
        }
    } else if (action.type === 'UPDATE_USER_ID') {
        return {
            ...state,
            user_id : action.user_id
        }
    } else if (action.type === 'UPDATE_HAND') {
        return {
            ...state,
            hand : action.hand
        }
    } else if (action.type === 'UPDATE_UNTOUCHED_HAND') {
        return {
            ...state,
            untouched_hand : action.untouched_hand
        }
    } else if (action.type === 'UPDATE_HIDDEN_HAND') {
        return {
            ...state,
            hidden_hand : action.hidden_hand
        }
    } else if (action.type === 'UPDATE_CENTER') {
        return {
            ...state,
            deck : action.center_state.deck,
            played_pile : action.center_state.played_pile,
            discard_pile : action.center_state.discard_pile
        }
    } else if (action.type === 'UPDATE_PLAYABLE_CARDS') {
        return {
            ...state,
            playable_cards : action.playable_cards
        }
    } else if (action.type === 'UPDATE_TURN_AT') {
        return {
            ...state,
            turn_at : action.turn_at
        }
    } else if (action.type === 'RESET_STATE') {
        return {
            user_id : "",
            username : "",
            game_id : "",
            players : [],
            player_names : [],
            player_swapped : [],
            player_num_cards : [],
            deck : 0,
            played_pile : [],
            discard_pile : [],
            hand : [],
            untouched_hand : [],
            hidden_hand : [],
            playable_cards : [],
            turn_at : "",
            messages : []
        }
    }
    return state;
} 

export default rootReducer;