import React, { Component } from 'react';
import { connect } from 'react-redux'; //used to take data from redux store and map to props
import { SERVER } from '../constants/envConstants';
import axios from 'axios';
import Popup from 'reactjs-popup';

import {
    Jumbotron, 
    Container, 
    Button,
    Form
} from 'react-bootstrap';



import '../App.css';

class Home extends Component {
    state = {
        username : "",
        room : "",
        popUp : false,
        popUpMsg : ""
    }

    handleUsername = (event) => {
        this.setState({
            username : event.target.value
        });
    }

    handleRoomID = (event) => {
        this.setState({
            room : event.target.value
        });
    }

    handleFindRoom = (event) => {
        if (this.state.username.length > 30) {
            this.setState({
                popUpMsg: "Please enter a shorter username",
                popUp: true
            });
        } else if (!this.state.username.replace(/\s/g, '').length) {
            this.setState({
                popUpMsg: "Please enter a valid username",
                popUp: true
            });
        } else if (this.state.username === "" ) {
            this.setState({
                popUpMsg: "Please enter a username",
                popUp: true
            });
        } else if (this.state.room === "") {
            this.setState({
                popUpMsg: "Please enter a valid room ID",
                popUp: true
            });           
        } else {
            this.setState({
                popUpMsg: "Finding room now...",
                popUp: true
            });
            //Attempt to join the room
            axios.post(SERVER('room/' + this.state.room + '/join'), {
                username : this.state.username
            }).then((res) => {
                console.log(this.state, res.data);
                if (!res.data.success) {
                    this.setState({
                        room: "",
                        popUpMsg: res.data.err_msg,
                        popUp: true
                    });       
                } else {
                    //If room is found, save the necessary info and redirect player to game lobby
                    this.setState({
                        popUpMsg: "",
                        popUp: false                   
                    });
    
                    this.props.updatePlayerNames([...res.data.players_in_room, this.state.username]);
                    this.props.updateUserID(res.data.user_id);
                    this.props.updateGameID(this.state.room);
                    this.props.updateUsername(this.state.username);
    
                    this.props.history.push('/lobby');       
                }  
            });
        }
    }

    handleCreateRoom = (event) => {
        if (this.state.username.length > 30) {
            this.setState({
                popUpMsg: "Please enter a shorter username",
                popUp: true
            });
            return;
        }  
        
        if (!this.state.username.replace(/\s/g, '').length) {
            this.setState({
                popUpMsg: "Please enter a valid username",
                popUp: true
            });
            return;
        }

        if (this.state.username === "") {
            this.setState({
                popUpMsg: "Please enter a username",
                popUp: true
            });
            return;
        }
        this.setState({
            popUpMsg: "Creating room now...",
            popUp: true
        });
        //Attempt to create the room
        axios.post(SERVER('room/create'), {
            username : this.state.username
        }).then((res) => {
            console.log(res.data);
            if (!res.data.success) {
                this.setState({
                    room: "",
                    popUpMsg: res.data.err_msg,
                    popUp: true
                });       
            } else {
                //If successful, save all the necessary info
                this.setState({
                    popUpMsg: "",
                    popUp: false                   
                });
                
                this.props.updatePlayerNames([this.state.username]);
                this.props.updateUserID(res.data.user_id);
                this.props.updateGameID(res.data.room_id);
                this.props.updateUsername(this.state.username);

                this.props.history.push('/lobby');
            }
        });

    }

    closePopUp = (event) => {
        this.setState({ popUp : false, popUpMsg: "" });
    }

    componentDidMount() {
        this.props.resetState();
    }

    render() {
        return (
            <Container className="p-5">
                <Jumbotron>
                <h1 className="header">♠ ♥ Play Idiot ♣ ♦</h1>
                <Form>
                    <Form.Group>
                        <Form.Label>Enter Room ID (for joining a room)</Form.Label>
                        <Form.Control className="input-field" onChange={this.handleRoomID} value={this.state.room}  type="text" placeholder="Room ID" />
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>Username</Form.Label>
                        <Form.Control className="input-field" onChange={this.handleUsername} value={this.state.username} type="text" placeholder="Username" />
                    </Form.Group>
                </Form>
                <div>     
                    <Button className="home-btn" onClick={this.handleFindRoom} variant="secondary">Find Room</Button>
                    <Button className="home-btn" onClick={this.handleCreateRoom} variant="secondary">Create Room</Button>
                </div>
                </Jumbotron>


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
        turn_at : state.turn_at
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
        resetState: () => {dispatch({type: 'RESET_STATE'})}

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Home) 