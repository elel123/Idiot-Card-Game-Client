import React, { Component } from 'react';
import { connect } from 'react-redux'; //used to take data from redux store and map to props
import { SERVER } from '../constants/envConstants';
import axios from 'axios';
import Popup from 'reactjs-popup';
import { socket } from '../socket/socket';

import {
    Container, 
    Button,
    Col,
    Row
} from 'react-bootstrap';



import '../App.css';


class Lobby extends Component {
    state = {
        popUp : false,
        popUpMsg : "",
    }

    closePopUp = (event) => {
        this.setState({ popUp : false, popUpMsg: "" });
    }

    removePlayerHandler = (playerName) => {
        axios.post(SERVER('room/' + this.props.game_id + '/removePlayer'), {
            user_id : this.props.user_id,
            player_to_be_deleted : playerName
        }).then((res) => {
            if (res.data.success) {
                let filtered = this.props.player_names.filter((name) => {return name !== playerName});
                this.props.updatePlayerNames(filtered);
            } else {
                alert("Error: Recommended to restart game.");
            }
        })
        this.props.updatePlayerNames(this.props.player_names.filter((name) => {return name !== playerName}));
        socket.emit('remove', {"removed_player" : playerName, "game_id" : this.props.game_id});
    }

    leaveRoomHandler = (event) => {
        if (this.props.user_id !== "") {
            axios.post(SERVER('room/' + this.props.game_id + '/leaveRoom'), { 
                user_id : this.props.user_id
            }).then((res) => {
                console.log(res);
                if (!res.data.success) {
                    alert("Error: Recommended to restart game.");
                }
                socket.emit('leave', {"username" : this.props.username, "game_id" : this.props.game_id});
                socket.emit('disconnect-from-room', {"game_id" : this.props.game_id});
                socket.off();
                this.props.resetState();
                this.props.history.push('/');
            });
        } else {
            this.props.resetState();
            this.props.history.push('/');
        }
    }

    startGameHandler = (event) => {
        if (this.props.user_id !== "") {
            if (this.props.username === this.props.player_names[0]) {
                axios.put(SERVER('room/' + this.props.game_id + '/start'), {
                    user_id : this.props.user_id
                }).then((res) => {
                    if (!res.data.success) {
                        this.setState({
                            popUp: true,
                            popUpMsg: res.data.err_msg
                        });
                    } else {
                        socket.emit('start', {"game_id" : this.props.game_id});

                        //Redirect to the game room
                        axios.get(SERVER('game/' + this.props.game_id + '/' + this.props.user_id + '/state')).then((res) => {
                            this.props.updateState({
                                players : res.data.other_players,
                                deck : res.data.draw_deck_size,
                                played_pile : res.data.played_pile,
                                discard_pile : res.data.discard_pile,
                                hand : res.data.hand,
                                untouched_hand : res.data.untouched_hand,
                                hidden_hand : res.data.hidden_hand,
                                playable_cards : res.data.playable_cards,
                                turn_at : res.data.turn_at
                            });

                            console.log(this.props);
                            this.props.history.push('/Game');
                        });
                    }

                })
            } else {
                this.setState({
                    popUp: true,
                    popUpMsg: "Only the VIP can start the game!"
                });
            }
        } else {
            this.props.history.push('/');
        }
    }

    displaySettings = () => {
        this.setState({
            popUp: true,
            popUpMsg: (
                <Container>
                    <Row><Col><div className="center-div"><b>Settings</b></div></Col></Row>
                    <Row><Col><div className="center-div">Only the VIP can modify the game settings</div></Col></Row>
                    <Row><hr></hr></Row>
                    <Row>
                        <Col>
                            Play Duplicate Cards: 
                        </Col>
                        <Col>
                            <div>
                                <Button onClick={() => {this.updatePlayMult(true);}} className="home-btn" variant={this.props.settings.playMult ? "secondary" : "outline-secondary"}>On</Button>
                                <Button onClick={() => {this.updatePlayMult(false);}} className="home-btn" variant={!this.props.settings.playMult ? "secondary" : "outline-secondary"}>Off</Button>
                            </div>
                        </Col>
                    </Row>
                    <Row><hr></hr></Row>
                    <Row>
                        <Col>
                            Auto Draw Cards: 
                        </Col>
                        <Col>
                            <div>
                                <Button onClick={() => {this.updateAutoDraw(true);}} className="home-btn" variant={this.props.settings.autoDraw ? "secondary" : "outline-secondary"}>On</Button>
                                <Button onClick={() => {this.updateAutoDraw(false);}} className="home-btn" variant={!this.props.settings.autoDraw ? "secondary" : "outline-secondary"}>Off</Button>
                            </div>
                        </Col>
                    </Row>
                    <Row><hr></hr></Row>
                    <Row>
                        <Col>
                            View Discard Pile: 
                        </Col>
                        <Col>
                            <div>
                                <Button onClick={() => {this.updateShowDiscard(true);}} className="home-btn" variant={this.props.settings.showDiscard ? "secondary" : "outline-secondary"}>On</Button>
                                <Button onClick={() => {this.updateShowDiscard(false);}} className="home-btn" variant={!this.props.settings.showDiscard ? "secondary" : "outline-secondary"}>Off</Button>
                            </div>
                        </Col>
                    </Row>
                </Container>
            )
        });
    }

    updatePlayMult = (setting) => {
        if (this.props.player_names[0] !== this.props.username) {
            this.setState({popUpMsg : "Only the VIP can modify the game settings."});
            return;
        }

        if (setting === this.props.settings.playMult) {
            return;
        }

        this.props.updateSettings({
            playMult : setting,
            autoDraw : this.props.settings.autoDraw,
            showDiscard : this.props.settings.showDiscard
        });

        setTimeout(() => {
            this.displaySettings();
            socket.emit('edit-settings', {"game_id" : this.props.game_id, "settings" : this.props.settings});
        }, 200);
    }

    updateAutoDraw = (setting) => {
        if (this.props.player_names[0] !== this.props.username) {
            this.setState({popUpMsg : "Only the VIP can modify the game settings."});
            return;
        }

        if (setting === this.props.settings.autoDraw) {
            return;
        }

        this.props.updateSettings({
            playMult : this.props.settings.playMult,
            autoDraw : setting,
            showDiscard : this.props.settings.showDiscard
        });
        

        setTimeout(() => {
            this.displaySettings();
            socket.emit('edit-settings', {"game_id" : this.props.game_id, "settings" : this.props.settings});
        }, 200);
    }

    updateShowDiscard = (setting) => {
        if (this.props.player_names[0] !== this.props.username) {
            this.setState({popUpMsg : "Only the VIP can modify the game settings."});
            return;
        }

        if (setting === this.props.settings.showDiscard) {
            return;
        }

        this.props.updateSettings({
            playMult : this.props.settings.playMult,
            autoDraw : this.props.settings.autoDraw,
            showDiscard : setting
        });

        setTimeout(() => {
            this.displaySettings();
            socket.emit('edit-settings', {"game_id" : this.props.game_id, "settings" : this.props.settings});
        }, 200);
    }

    checkPlayerConnection = () => {
        axios.get(SERVER('room/' + this.props.game_id + '/' + this.props.user_id + '/checkInRoom')).then((res) => {
            if (!res.data.found) {
                alert("Disconnected from the room.");
                socket.emit('leave', {"username" : this.props.username, "game_id" : this.props.game_id});
                socket.emit('disconnect-from-room', {"game_id" : this.props.game_id});
                socket.off();

                //Remove the user entry from the db
                axios.delete(SERVER('user/' + this.props.user_id));

                this.props.resetState();
                this.props.history.push('/');
            }
        });
    }

    //Lifecycle Methods
    componentDidMount() {

        this.props.updateSettings({
            playMult : true,
            autoDraw : true,
            showDiscard : true
        });
        
        if (this.props.game_id) {
            socket.emit('join', {"username" : this.props.username, "game_id" : this.props.game_id});
        }

        //Listening for players joining/leaving
        socket.on('player-join', ({username}) => {
            console.log(`${username} joined the room.`);
            this.props.updatePlayerNames([...this.props.player_names, username]);
            
            //Update the new player on setting changes
            if (this.props.player_names[0] === this.props.username) {
                socket.emit('edit-settings', {"game_id" : this.props.game_id, "settings" : this.props.settings});
            }

            this.checkPlayerConnection();
        });
        socket.on('player-leave', ({username}) => {
            console.log(`${username} left the room.`);
            this.props.updatePlayerNames(this.props.player_names.filter((name) => {return name !== username}));
            this.checkPlayerConnection();
        });
        socket.on('removed-player', ({removed_player}) => {
            console.log(`${removed_player} has been removed the room.`);
            if (this.props.username === removed_player) {
                alert("You have been removed from the room");
                socket.emit('disconnect-from-room', {"game_id" : this.props.game_id});
                socket.off();
                this.props.resetState();
                this.props.history.push('/');
            } else {
                this.props.updatePlayerNames(this.props.player_names.filter((name) => {return name !== removed_player}));
            }
            
        });
        socket.on('settings-changed', ({settings}) => {
            this.props.updateSettings({
                playMult : settings.playMult,
                autoDraw : settings.autoDraw,
                showDiscard : settings.showDiscard
            });
        });
        socket.on('game-start', () => {
            alert("game started");
            axios.get(SERVER('game/' + this.props.game_id + '/' + this.props.user_id + '/state')).then((res) => {
                this.props.updateState({
                    players : res.data.other_players,
                    deck : res.data.draw_deck_size,
                    played_pile : res.data.played_pile,
                    discard_pile : res.data.discard_pile,
                    hand : res.data.hand,
                    untouched_hand : res.data.untouched_hand,
                    hidden_hand : res.data.hidden_hand,
                    playable_cards : res.data.playable_cards,
                    turn_at : res.data.turn_at
                });

                this.props.history.push('/Game');
            });
        });

        window.addEventListener("beforeunload", (ev) => 
        {  
            ev.preventDefault();
            socket.emit('leave', {"username" : this.props.username, "game_id" : this.props.game_id});
            socket.emit('disconnect-from-room', {"game_id" : this.props.game_id});
            socket.off();
            this.props.resetState();
        });

        window.addEventListener('popstate', (ev) => {
            ev.preventDefault();
            alert('Please use the "Leave Room" button next time when leaving this page.');
            socket.emit('leave', {"username" : this.props.username, "game_id" : this.props.game_id});
            socket.emit('disconnect-from-room', {"game_id" : this.props.game_id});
            socket.off();
            this.props.resetState();
            this.props.history.push('/');
        });
    }

    render() {
        let players = this.props.player_names.map((name, index) => {
            if (index === 0) {
                return (
                    <div className="player-list" key={name}>
                        <p>{name} (VIP)</p>
                    </div>
                )
            } else if (this.props.username === this.props.player_names[0]) {
                return (
                    <div className="player-list" key={name}>
                        <p>{name}</p>
                        <Button onClick={() => {this.removePlayerHandler(name)}} className="remove-button" variant="outline-secondary" size="sm">Remove</Button>
                    </div>                    
                )
            } else {
                return (
                    <div className="player-list" key={name}>
                        <p>{name}</p>
                    </div>
                )
            }
        
        })

        return (
            <Container className="p-5">
                <h2 className="header">Lobby</h2>
                <h5 className="header">Room ID: {this.props.game_id === "" ? "(Return to the homepage to join/create a game)" : this.props.game_id}</h5>
                <div>
                    <Button onClick={this.startGameHandler} className="home-btn" variant="secondary">Start Game</Button>
                    <Button onClick={this.leaveRoomHandler} className="home-btn" variant="secondary">Leave Room</Button>
                    <Button onClick={() => {this.displaySettings()}} className="home-btn" variant="secondary"><span role="img">⚙️</span></Button>
                </div>
                <hr></hr>
                <div>
                    {players}
                </div>
                <Popup open={this.state.popUp} onClose={this.closePopUp} modal closeOnDocumentClick>
                    <div>{this.state.popUpMsg}</div>
                </Popup>
            </Container>
            
        )
    }
}

//state contains information from the store 
const mapStateToProps = (state, ownProps) => {
    return {
        user_id : state.user_id,
        username : state.username,
        game_id : state.game_id,
        players : state.players,
        player_names : state.player_names,
        deck : state.deck,
        played_pile : state.played_pile,
        discard_pile : state.discard_pile,
        hand : state.hand,
        untouched_hand : state.untouched_hand,
        hidden_hand : state.hidden_hand,
        playable_cards : state.playable_cards,
        turn_at : state.turn_at,
        settings : state.settings
    }
}

//dispatchs an action to make a change to the redux store 
//now the props will include the updateState method
const mapDispatchToProps = (dispatch) => {
    return {
        updateState: (gameState) => {dispatch({type: 'UPDATE_STATE', gameState: gameState})},
        updateGameID: (game_id) => {dispatch({type: 'UPDATE_GAME_ID', game_id: game_id})},
        updateUsername: (username) => {dispatch({type: 'UPDATE_USERNAME', username: username})},
        updatePlayerNames: (player_names) => {dispatch({type: 'UPDATE_PLAYER_NAMES', player_names: player_names})},
        updateUserID: (user_id) => {dispatch({type: 'UPDATE_USER_ID', user_id : user_id})},
        updateSettings: (settings) => {dispatch({type: 'UPDATE_SETTINGS', settings: settings})},
        resetState: () => {dispatch({type: 'RESET_STATE'})},

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Lobby) 