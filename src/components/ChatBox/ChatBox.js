import React, {Component} from 'react';
import { connect } from 'react-redux';
import ScrollToBottom from 'react-scroll-to-bottom';

import {
    Form,
    Button,
    InputGroup
} from 'react-bootstrap'

import './ChatBox.css';
import { socket } from '../../socket/socket';

class ChatBox extends Component {

    state = {
        message : ""
    }

    messageTypeHandler = (event) => {
        this.setState({
            message : event.target.value
        });
    }

    messageSendHandler = (event) => {
        event.preventDefault();
        if (this.state.message !== "") {
            this.setState({message : ""});
            this.props.updateMessages([...this.props.messages, {username : this.props.username, message : this.state.message}]);
            socket.emit('send-message', {"game_id" : this.props.game_id, "username" : this.props.username, "message" : this.state.message});
        }   
    }

    componentDidMount() {
        socket.on('sent-message', ({username, message}) => {
            this.props.updateMessages([...this.props.messages, {username : username, message : message}]);
        });
    }
 
    render() {
        let messageDisplay;
        if (this.props.username !== "") {
            messageDisplay = this.props.messages.map((msg, index) => {
                if (msg.username === '') {
                    return (
                        <div className="admin-message" key={index}>{"➤  " + msg.message}</div>
                    )
                }
                return (
                    <div key={index}>{msg.username}: {msg.message}</div>
                )
            });
        }
         
        return (
            <>
                <ScrollToBottom className="chat-box" mode="bottom">
                    <div className="chat-box message-list">
                        {messageDisplay}
                    </div>
                </ScrollToBottom>
                <Form onSubmit={this.messageSendHandler}>
                    <Form.Group>
                        <InputGroup className="mb-3">
                            <Form.Control
                                placeholder="Type message here..."
                                onChange={this.messageTypeHandler} 
                                value={this.state.message}
                            />
                            <InputGroup.Append>
                                <Button onClick={this.messageSendHandler} variant="secondary">Send</Button>
                            </InputGroup.Append>
                        </InputGroup>
                    </Form.Group>
                </Form>
            </>
        )
    }
    
}

//state contains information from the store 
const mapStateToProps = (state, ownProps) => {
    return {
        username : state.username,
        game_id : state.game_id,
        messages : state.messages
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        updateMessages: (messages) => {dispatch({type: 'UPDATE_MESSAGES', messages: messages})}
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ChatBox);


// const ChatBox = ({game_id, username, })