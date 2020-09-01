import React, { Component } from 'react';
import { connect } from 'react-redux'; //used to take data from redux store and map to props
import { SERVER } from '../constants/envConstants';
import axios from 'axios';
import Popup from 'reactjs-popup';
import { socket } from '../socket/socket';
import { Card } from './Card/Card';
import { DECK_NUM } from '../constants/constants';
import ChatBox from './ChatBox/ChatBox';
import { calcCard } from '../utils/calcCard';

import {
    Container, 
    Button,
    Row,
    Col,
    Form,
    InputGroup
} from 'react-bootstrap';



import '../App.css';


class Game extends Component {
    state = {
        swapPhase : true,
        everyoneSwapped : false,
        showSwapButtons : true,
        selectedHandCards : [],
        selectedUntouchedCards : [],
        gameEnded : false,

        //States that control the center
        haveToTakeCenter : false,
        drawCardOpps : 0,

        showHiddenCardMsg : false,
        popUp : false,
        popUpMsg : ""
    }

    closePopUp = (event) => {
        this.setState({ popUp : false, popUpMsg: "" });
    }

    cardPlayHandler = (card, fromUntouched) => {
        console.log(card, fromUntouched);
        if (this.state.gameEnded) {
            this.displayGameEndedMessage();
            return;
        }
        //Prevent the player from playing another card after having played a hidden card.
        if (this.state.haveToTakeCenter) {
            this.setState({
                popUpMsg : "You cannot play another other card! Take from the center to end your turn.",
                popUp : true
            });
            return;
        }

        //For the swapping phase
        if (!this.state.everyoneSwapped) {
            if (fromUntouched) {
                if (this.state.selectedUntouchedCards.indexOf(card) !== -1) {
                    this.setState({selectedUntouchedCards : this.state.selectedUntouchedCards.filter(item => item !== card)});
                } else {
                    this.setState({selectedUntouchedCards : [...this.state.selectedUntouchedCards, card]});
                }
            } else {
                if (this.state.selectedHandCards.indexOf(card) !== -1) {
                    this.setState({selectedHandCards : this.state.selectedHandCards.filter(item => item !== card)});
                } else {
                    this.setState({selectedHandCards : [...this.state.selectedHandCards, card]});
                }
            }

        //For after the swapping phase ends (playing cards)
        } else if (this.props.turn_at === this.props.username) {
            if (fromUntouched && (this.props.deck !== 0 || this.props.hand.length !== 0)) {
                this.setState({
                    popUpMsg : "This card can only be played once the deck runs out and you have no cards in your hand.",
                    popUp : true
                });
            } else if (this.props.playable_cards === undefined) {
                alert("Warning: playable cards is undefined");
            } else if (this.props.playable_cards.indexOf(card) === -1) {
                this.setState({
                    popUpMsg : "This card cannot beat the card in the center.",
                    popUp : true
                });
            } else {
                axios.put(SERVER('game/' + this.props.game_id + '/playCard'), {
                    user_id : this.props.user_id,
                    card_played : card,
                    from_untouched : fromUntouched
                }).then((res) => {
                    if (!res.data.success) {
                        this.setState({
                            popUpMsg : res.data.err_msg,
                            popUp : true
                        });
                        //if the room data has been deleted, prompt inactivty message
                        if (res.data.err_msg === "Room does not exist!") {
                            this.displayInactivityMessage();
                            socket.emit('data-lost', {"game_id" : this.props.game_id});
                        }
                    } else {
                        if (fromUntouched) {
                            this.props.updateUntouchedHand(this.props.untouched_hand.map((item) => {return (item === card) ? -1 : item }));
                        } else {
                            this.props.updateHand(this.props.hand.filter(item => item !== card));
                        }
                        this.props.updateCenter({
                            deck : this.props.deck,
                            played_pile : [...this.props.played_pile, card],
                            discard_pile : this.props.discard_pile
                        });

                        //Update the chat
                        this.props.updateMessages([...this.props.messages, {username : "", message : this.props.username + " played a " + calcCard(card) + "!"}]);

                        if (res.data.go_again) {
                            if (res.data.is_burn) { 
                                this.setState({
                                    popUpMsg : "You burned the play pile! You can play another card! Remember to draw a card for every card you play!",
                                    popUp : true
                                });
                                this.props.updateMessages([...this.props.messages, {username : "", message : "The play pile was burned!"}]);
                                this.props.updateCenter({
                                    deck : this.props.deck,
                                    played_pile : [],
                                    discard_pile : [...this.props.discard_pile, ...this.props.played_pile]
                                });
                            } else {
                                this.setState({
                                    popUpMsg : "You can play another card! Remember to draw a card for every card you play!",
                                    popUp : true
                                });
                            }
                            //Update the playable cards because the next card can be anything
                            this.props.updatePlayableCards(DECK_NUM);
                        } else {
                            //If the player doesn't go again, move turn pointer to next player
                            let index = this.props.player_names.indexOf(this.props.username);
                            this.props.updateTurnAt(index === this.props.player_names.length - 1 ? this.props.player_names[0] : this.props.player_names[index + 1]);
                        }

                        if (!this.state.popUp && this.props.hand.length <= 1 && this.props.deck > 0) {
                            this.setState({
                                popUpMsg : "Remember to draw a card for every card you play!",
                                popUp : true
                            });
                        }
                        

                        //Update the card draw opps so the player can draw a card
                        if (this.props.hand.length < 4) {
                            this.setState({drawCardOpps : 4 - this.props.hand.length});
                        }
                        
                        //Check to see if the player has reach their hidden cards
                        if (this.props.hand.length === 0 && this.props.deck === 0 && 
                            this.props.untouched_hand[0] === -1 && this.props.untouched_hand[1] === -1 &&
                            this.props.untouched_hand[2] === -1) {


                            //Check to see if the player has won
                            if (this.props.hidden_hand.indexOf(false) === -1) {
                                this.displayWinMessage(this.props.username);
                            }

                            if (!this.state.showHiddenCardMsg) {
                                this.setState({
                                    showHiddenCardMsg : true,
                                    popUpMsg : "You have reached your last 3 cards! These are face-down, hidden cards. On your turn, you need to select one to play at random. If the card doesn't beat the center, you must take the center cards.",
                                    popUp : true
                                });
                            }
                            
                        }
                        //Notify other players of your turn
                        socket.emit('play-card', {"game_id" : this.props.game_id, "card" : card, "username" : this.props.username, "playable" : true, "is_burn" : res.data.is_burn});
                        
                    }
                });
            }
        } else {
            this.setState({
                popUpMsg : `It is not your turn! (It's ${this.props.turn_at}'s turn)`,
                popUp : true
            });
        }
    }

    swapCardHandler = () => {
        console.log(this.state);
        if (this.state.selectedHandCards.length !== this.state.selectedUntouchedCards.length) {
            this.setState({
                popUpMsg : "You must choose the same number of face up cards in your hand and on the game board to swap.",
                popUp : true
            });
        } else {
            axios.put(SERVER('game/' + this.props.game_id + '/swap'), {
                user_id : this.props.user_id,
                untouched : this.state.selectedUntouchedCards,
                hand : this.state.selectedHandCards
            }).then((res) => {
                if (!res.data.success) {
                    this.setState({
                        popUpMsg : res.data.err_msg,
                        popUp : true
                    });
                    if (res.data.err_msg === "Room does not exist!") {
                        this.displayInactivityMessage();
                        socket.emit('data-lost', {"game_id" : this.props.game_id});
                    }
                } else {
                    axios.get(SERVER('game/' + this.props.game_id + '/' + this.props.user_id + '/state')).then((subRes) => {
                        this.props.updateState({
                            players : subRes.data.other_players,
                            deck : subRes.data.draw_deck_size,
                            played_pile : subRes.data.played_pile,
                            discard_pile : subRes.data.discard_pile,
                            hand : subRes.data.hand,
                            untouched_hand : subRes.data.untouched_hand,
                            hidden_hand : subRes.data.hidden_hand,
                            playable_cards : subRes.data.playable_cards,
                            turn_at : subRes.data.turn_at
                        });
                        this.setState({selectedUntouchedCards : [], selectedHandCards : []});
                        //Notify the other players to update their views
                        socket.emit('swap', {"game_id" : this.props.game_id});
                    });   
                }
            });
        }
    }

    lockInHandler = () => {
        if (this.state.swapPhase) {
            axios.put(SERVER('game/' + this.props.game_id + '/ready'), {
                user_id : this.props.user_id
            }).then((res) => {
                if (!res.data.success) {
                    if (res.data.err_msg === "Room does not exist!") {
                        this.displayInactivityMessage();
                        socket.emit('data-lost', {"game_id" : this.props.game_id});
                    }
                } else {
                    axios.get(SERVER('game/' + this.props.game_id + '/' + this.props.user_id + '/state')).then((subRes) => {
                        this.props.updateState({
                            players : subRes.data.other_players,
                            deck : subRes.data.draw_deck_size,
                            played_pile : subRes.data.played_pile,
                            discard_pile : subRes.data.discard_pile,
                            hand : subRes.data.hand,
                            untouched_hand : subRes.data.untouched_hand,
                            hidden_hand : subRes.data.hidden_hand,
                            playable_cards : subRes.data.playable_cards,
                            turn_at : subRes.data.turn_at
                        });
                        this.props.updateMessages([...this.props.messages, {username : "", message : this.props.username + " has locked in their swaps!"}]);
                        this.setState({swapPhase : false});
                        if (res.data.everyone_ready) {
                            this.setState({everyoneSwapped : true});
                            this.props.updateMessages([...this.props.messages, {username : "", message : "Everyone is ready. Let the game start!"}]);
                            console.log(this.state);
                        }
                        //Notify other players
                        socket.emit('lock-in', {"game_id" : this.props.game_id, "username" : this.props.username});
                    }); 
                }
            });
        }
    }

    playHiddenHandler = (cardPosition) => {
        //Prevent the player from playing another card after having played a hidden card.
        if (this.state.haveToTakeCenter) {
            this.setState({
                popUpMsg : "You cannot play another other card! Take from the center to end your turn.",
                popUp : true
            });
            return;
        }

        if (this.state.gameEnded) {
            this.displayGameEndedMessage();
            return;
        }

        //Check to see if the player has reach their hidden cards
        if (this.props.hand.length > 0 || this.props.deck > 0 ||
            this.props.untouched_hand[0] !== -1 || this.props.untouched_hand[1] !== -1 ||
            this.props.untouched_hand[2] !== -1) {

            this.setState({
                popUpMsg : "You cannot play your hidden cards yet!",
                popUp : true
            });
        } else {
            axios.put(SERVER('game/' + this.props.game_id + '/playHidden'), {
                user_id : this.props.user_id,
                card_position : cardPosition
            }).then((res) => {
                if (!res.data.success) {
                    this.setState({
                        popUpMsg : res.data.err_msg,
                        popUp : true
                    });
                    if (res.data.err_msg === "Room does not exist!") {
                        this.displayInactivityMessage();
                        socket.emit('data-lost', {"game_id" : this.props.game_id});
                    }
                } else {
                    //Remove the card from the hidden hand
                    this.props.updateHiddenHand(this.props.hidden_hand.map((item, index) => {
                        return (index === cardPosition) ? true : item;
                    }));

                    if (!res.data.playable) {
                        this.setState({
                            popUpMsg : "Your card cannot beat the center! Take the cards in the center to end your turn.",
                            popUp : true,
                            haveToTakeCenter : true
                        });
                        this.props.updateMessages([...this.props.messages, {username : "", message : this.props.username + " attempted to play a " + calcCard(res.data.card_reveal) + "!"}]);
                        this.props.updateCenter({
                            deck : this.props.deck,
                            played_pile : [...this.props.played_pile, res.data.card_reveal],
                            discard_pile : this.props.discard_pile
                        });                        
                    } else {
                        this.props.updateMessages([...this.props.messages, {username : "", message : this.props.username + " played a " + calcCard(res.data.card_reveal) + "!"}]);
                        this.props.updateHiddenHand(this.props.hidden_hand.map((item, index) => {return (index === cardPosition) ? true : item}));
                        if (res.data.go_again) {
                            if (res.data.is_burn) { 
                                this.setState({
                                    popUpMsg : "You burned the play pile! You can play another card! Remember to draw a card for every card you play!",
                                    popUp : true
                                });
                                this.props.updateMessages([...this.props.messages, {username : "", message : "The play pile was burned!"}]);
                                this.props.updateCenter({
                                    deck : this.props.deck,
                                    played_pile : [],
                                    discard_pile : [...this.props.discard_pile, ...this.props.played_pile, res.data.card_reveal]
                                });
                            } else {
                                this.setState({
                                    popUpMsg : "You can play another card! Remember to draw a card for every card you play!",
                                    popUp : true
                                });
                                this.props.updateCenter({
                                    deck : this.props.deck,
                                    played_pile : [...this.props.played_pile, res.data.card_reveal],
                                    discard_pile : this.props.discard_pile
                                });
                            }
                            //Update the playable cards because the next card can be anything
                            this.props.updatePlayableCards(DECK_NUM);
                        } else {
                            //If the player doesn't go again, move turn pointer to next player
                            let index = this.props.player_names.indexOf(this.props.username);
                            this.props.updateTurnAt(index === this.props.player_names.length - 1 ? this.props.player_names[0] : this.props.player_names[index + 1]);
                            this.props.updateCenter({
                                deck : this.props.deck,
                                played_pile : [...this.props.played_pile, res.data.card_reveal],
                                discard_pile : this.props.discard_pile
                            });
                        }

                        //Check to see if the player has won
                        if (this.props.hidden_hand.indexOf(false) === -1) {
                            this.displayWinMessage(this.props.username);
                        }
                    }

                    //Notify other players about your turn
                    socket.emit('play-card', {"game_id" : this.props.game_id, "card" : res.data.card_reveal, "username" : this.props.username, "playable" : res.data.playable, "is_burn" : res.data.is_burn});
                }
            });
        }
    }

    deckClickHandler = () => {
        console.log(this.props);
        if (this.state.drawCardOpps <= 0) {
            this.setState({
                popUpMsg : "You have drawn the maximum possible cards at the current moment.",
                popUp : true
            });
        } else if (this.props.deck <= 0) {
            this.setState({
                popUpMsg : "The deck has no more cards left.",
                popUp : true
            });
        } else {
            axios.put(SERVER('game/' + this.props.game_id + '/drawCard'), {
                user_id : this.props.user_id
            }).then((res) => {
                if (!res.data.success) {
                    this.setState({
                        popUpMsg : res.data.err_msg,
                        popUp : true
                    });
                    if (res.data.err_msg === "Room does not exist!") {
                        this.displayInactivityMessage();
                        socket.emit('data-lost', {"game_id" : this.props.game_id});
                    }
                } else {
                    //Add the drawn card to the player's hand
                    this.props.updateHand([...this.props.hand, res.data.card_drawn]);
                    this.props.updateCenter({
                        deck : this.props.deck - 1,
                        played_pile : this.props.played_pile,
                        discard_pile : this.props.discard_pile
                    });

                    this.setState({drawCardOpps : this.state.drawCardOpps - 1});

                    //Notify the other players about the drawing
                    socket.emit('draw-card', {"game_id" : this.props.game_id, "username" : this.props.username});
                }
            });
        }
    }

    playPileClickHandler = () => {
        let playedCards = this.props.played_pile.map((card) => {
            return (
                <Card float={true} key={card} number={card}/>
            )
        });
        this.setState({
            popUpMsg : (
                <Container>
                    <Row><Col><div className="center-div"><Button className="take-center-btn" onClick={this.takeFromCenterHandler} variant="outline-secondary" size="sm">Take The Center</Button></div></Col></Row>
                    <Row><hr></hr></Row>
                    <Row>{playedCards}</Row>
                </Container>
            ),
            popUp : true
        });
    }

    discardPileClickHandler = () => {
        let discardedCards = this.props.discard_pile.map((card) => {
            return (
                <Card float={true} key={card} number={card}/>
            )
        });
        this.setState({
            popUpMsg : discardedCards,
            popUp : true
        });
    }

    takeFromCenterHandler = () => {
        if (this.state.gameEnded) {
            this.displayGameEndedMessage();
        } else if (!this.state.everyoneSwapped) {
            this.setState({
                popUpMsg : "The swapping phase hasn't ended yet!",
                popUp : true
            });
        } else if (this.props.turn_at !== this.props.username) {
            this.setState({
                popUpMsg : "It's not your turn!",
                popUp : true
            });
        } else {
            let combinedCards = (this.props.hand.length > 0 || this.props.deck.length > 0) ? [...this.props.hand, ...this.props.played_pile] : 
                                [...this.props.untouched_hand.filter(card => card !== -1), ...this.props.played_pile];
            let display = combinedCards.map((card) => {
                return (<Card clickable={true} float={true} playCard={() => {this.takeFromCenterHandlerHelper(card)}} fromUntouched={false} key={card} number={card}/>)
            });
            this.setState({
                popUpMsg : (
                    <Container>
                        <Row>Choose the card you want to leave in the center from your hand, the 3 face-up cards on the table (if your hand is empty), or the center pile (this will count as a turn).</Row>
                        <Row><hr></hr></Row>
                        <Row>{display}</Row>
                    </Container>
                ),
                popUp : true
            });
        }
    }

    takeFromCenterHandlerHelper = (card) => {
        axios.put(SERVER('game/' + this.props.game_id + '/takeFromCenter'), {
            user_id : this.props.user_id,
            chosen_card : card
        }).then((res) => {
            if (!res.data.success) {
                this.setState({
                    popUpMsg : res.data.err_msg,
                    popUp : true
                });

                if (res.data.err_msg === "Room does not exist!") {
                    this.displayInactivityMessage();
                    socket.emit('data-lost', {"game_id" : this.props.game_id});
                }
            } else {
                this.setState({
                    popUpMsg : "",
                    popUp : false,
                    haveToTakeCenter : false
                });
                //Transfer the center cards to the player's hands (and remove the chosen card from hand or untouched hand, wherever it is)
                this.props.updateHand([...this.props.hand.filter(item => item !== card), ...this.props.played_pile.filter(item => item !== card)]);
                this.props.updateUntouchedHand(this.props.untouched_hand.map((item) => {return (item === card) ? -1 : item}));
                this.props.updateCenter({
                    deck : this.props.deck,
                    played_pile : [card],
                    discard_pile : this.props.discard_pile
                });

                //Update the turn to the next player
                let index = this.props.player_names.indexOf(this.props.username);
                this.props.updateTurnAt(index === this.props.player_names.length - 1 ? this.props.player_names[0] : this.props.player_names[index + 1]);

                this.props.updateMessages([...this.props.messages, {username : "", message : `${this.props.username} took from the center!`}]);
                //Notify other players of the turn
                socket.emit('take-center', {"game_id" : this.props.game_id, "username" : this.props.username});
            }
        });
    }
    
    returnHomeHandler = () => {
        socket.emit('disconnect');
        socket.off();
        this.props.resetState();
        this.props.history.push('/');
    }

    displayInactivityMessage = () => {
        this.setState({
            popUpMsg : (
                <Container>
                    <Row><Col><div className="center-div">Game data lost due to inactivity or page refresh.</div></Col></Row>
                    <Row><Col><div className="center-div"><Button className="take-center-btn" onClick={this.returnHomeHandler} variant="secondary" size="sm">Leave Game</Button></div></Col></Row>
                </Container>
            ),
            popUp : true
        });
    }

    displayWinMessage = (winner) => {
        let message;
        if (winner === this.props.username) {
            message = "You have won! Return to the home screen to play another game.";
        } else {
            message = `${winner} has won! Return to the home screen to play another game.`;
        }
        this.setState({
            popUpMsg : (
                <Container>
                    <Row><Col><div className="center-div">{message}</div></Col></Row>
                    <Row><Col><div className="center-div"><Button className="take-center-btn" onClick={this.returnHomeHandler} variant="secondary" size="sm">Leave Game</Button></div></Col></Row>
                </Container>
            ),
            popUp : true
        });
    }

    displayGameEndedMessage = (winner) => {
        this.setState({
            popUpMsg : (
                <Container>
                    <Row><Col><div className="center-div">The game has ended.</div></Col></Row>
                    <Row><Col><div className="center-div"><Button className="take-center-btn" onClick={this.returnHomeHandler} variant="secondary" size="sm">Leave Game</Button></div></Col></Row>
                </Container>
            ),
            popUp : true
        });
    }

    displayHelpMessage = () => {
        this.setState({
            popUpMsg : (
                <Container>
                    <Row><Col><div className="center-div"><b>How to play Burn/Idiot</b></div></Col></Row>
                    <Row>
                        This game in a way is similar to Deuce (Big 2) where the goal is to try to get rid of 
                        all of your cards. However, in this game there are power cards (2, 3, 7, 10) which can beat 
                        any card and have special effects. This would mean that the lowest card is actually a 4,
                        and the highest card is an Ace (suits do not matter). For the effects of the power cards,
                        2 allows you to go again, 3 mirrors the card that's below it (but doesn't mirror a 2),
                        7 forces the next player to play a card that is below 7 (power cards, or 4, 5, 6), and 10
                        burns the play pile (moves everything to the discard). If there is a card you cannot beat in
                        the center, you must take the center cards to end your turn (click the play pile). 
                        Draw a card after every play, and once the deck runs out (including your hand), start 
                        playing the face-up table cards, and then the face-down table cards. In the beginning phase
                        of the game, players are allowed to swap cards in their hand with their cards face-up on the table.
                        Since those face-up cards are going to be played near the end-game, it is in your best interest
                        to swap some decently powerful cards to the table. (Click the cards you want to swap and they will
                        appear blue. Click the swap button once done.)
                        The winner is the one who has no more cards left.
                    </Row>
                    <Row><Col><div className="center-div"><b>Warning</b></div></Col></Row>
                    <Row>
                        This game is being timed for inactivity and could possibly delete itself if it's left
                        idle for too long. Note that typing in the chat does not count as activity.
                    </Row>
                </Container>
            ),
            popUp : true
        });
    }

    componentDidMount() {
        axios.get(SERVER('game/' + this.props.game_id + '/' + this.props.user_id + '/state')).then((res) => {
            if (!res.data.found) {
                this.displayInactivityMessage();
            }
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
        }).catch((error) => {
            this.displayInactivityMessage();
        });

        this.setState({
            popUpMsg : "Swapping Phase! Select cards to swap between your hand and the 3 table cards. Click 'Lock In' when finished.",
            popUp : true
        });

        socket.on('player-swap', () => {
            axios.get(SERVER('game/' + this.props.game_id + '/' + this.props.user_id + '/state')).then((res) => {
                if (!res.data.found) {
                    this.displayInactivityMessage();
                }
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

            });
        });

        socket.on('player-ready', ({username}) => {
            axios.get(SERVER('game/' + this.props.game_id + '/' + this.props.user_id + '/state')).then((res) => {
                if (!res.data.found) {
                    this.displayInactivityMessage();
                }
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

                this.props.updateMessages([...this.props.messages, {username : "", message : username + " has locked in their swaps!"}]);

                if (this.props.player_swapped.indexOf(false) === -1) {
                    this.setState({
                        everyoneSwapped : true
                    });
                    this.props.updateMessages([...this.props.messages, {username : "", message : "Everyone is ready. Let the game start!"}]);
                }
            });
        });

        socket.on('player-played', ({card, username, playable, is_burn}) => {
            axios.get(SERVER('game/' + this.props.game_id + '/' + this.props.user_id + '/state')).then((res) => {
                if (!res.data.found) {
                    this.displayInactivityMessage();
                }
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

                //Display the card played message to the chat (when implemented)
                if (playable) {
                    this.props.updateMessages([...this.props.messages, {username : "", message : username + " played a " + calcCard(card) + "!"}]);
                } else {
                    this.props.updateMessages([...this.props.messages, {username : "", message : username + " attempted to play a " + calcCard(card) + "!"}]);
                }

                if (is_burn) {
                    //Display the burn message to the chat
                    this.props.updateMessages([...this.props.messages, {username : "", message : "The play pile was burned!"}]);
                }

                if (res.data.is_won) {
                    this.displayWinMessage(res.data.winner);
                }
            });
        });

        socket.on('player-took-center', ({username}) => {
            axios.get(SERVER('game/' + this.props.game_id + '/' + this.props.user_id + '/state')).then((res) => {
                if (!res.data.found) {
                    this.displayInactivityMessage();
                }
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

                //Display the card played message to the chat (when implemented)
                this.props.updateMessages([...this.props.messages, {username : "", message : `${username} took from the center!`}]);
            });
        });

        socket.on('player-drew-card', ({username}) => {
            axios.get(SERVER('game/' + this.props.game_id + '/' + this.props.user_id + '/state')).then((res) => {
                if (!res.data.found) {
                    this.displayInactivityMessage();
                }
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

            });
        });

        socket.on('game-data-lost', () => {
            this.displayInactivityMessage();
        });

    }

    formatPlayerDisplay = (name, cardDisplay, numCards=null, swapped=null) => {
        let turnPointer = name === this.props.turn_at ? '☞ ' : "";
        if (numCards === null && swapped === null) {
            return (
                <>
                    <p className="player-names"><b>{turnPointer}Your Cards</b></p>
                    {cardDisplay}
                </>
            );
        } 
        return (
            <>
                <p className="player-names"><b>{turnPointer + name} - Cards In Hand: {numCards}  {swapped && !this.state.everyoneSwapped ? '- Ready' : null}</b></p>
                {cardDisplay}
            </>
        );
    }

    formatCenterDisplay = () => {
        let topPlayed = this.props.played_pile.length === 0 ? 0 : this.props.played_pile[this.props.played_pile.length - 1];
        let topDiscard = this.props.discard_pile.length === 0 ? 0 : this.props.discard_pile[this.props.discard_pile.length - 1];
        return (
            <>
                <Card clickable={true} clickFunct={this.deckClickHandler} float={true} blank={this.props.deck.length === 0} faceDown={true}/>
                <p>Deck (Cards Left: {this.props.deck}) (Click to draw)</p>
                <br></br>
                <Card clickable={true} clickFunct={this.playPileClickHandler} float={true} blank={topPlayed === 0} number={topPlayed}/>
                <p>Played Pile (Click to view)</p>
                <br></br>
                <Card clickable={true} clickFunct={this.discardPileClickHandler} float={true} blank={topDiscard === 0} number={topDiscard}/>
                <p>Discard Pile (Click to view)</p>
                <br></br>
            </>
        );
    }

    formatChatBoxDisplay = () => {
        return (
            <ChatBox/>
        )
    }

    formatHelpButtonDisplay = () => {
        return (<Button className="help-btn" onClick={this.displayHelpMessage} variant="secondary">Help</Button>);
    }

    render() {
        let playerNames;
        let playerNumCards;
        let playerSwapped;
        let playerCards;
        let hand;
        if (this.props.user_id !== "") {
            //Set up the display variables 
            playerNames = this.props.player_names;
            playerNumCards = this.props.player_num_cards;
            playerSwapped = this.props.player_swapped;
            playerCards = this.props.players.map(({untouched_hand, hidden_hand, player}) => {
                if (player === this.props.username) {
                    return (
                        <>
                            <Card highlight={this.state.swapPhase} clickable={true} float={true} playCard={this.cardPlayHandler} fromUntouched={true} blank={this.props.untouched_hand[0] === -1} key={this.props.username + '-untouched0-' + this.props.untouched_hand[0]} number={this.props.untouched_hand[0]}/>
                            <Card highlight={this.state.swapPhase} clickable={true} float={true} playCard={this.cardPlayHandler} fromUntouched={true} blank={this.props.untouched_hand[1] === -1} key={this.props.username + '-untouched1-' + this.props.untouched_hand[1]} number={this.props.untouched_hand[1]}/>
                            <Card highlight={this.state.swapPhase} clickable={true} float={true} playCard={this.cardPlayHandler} fromUntouched={true} blank={this.props.untouched_hand[2] === -1} key={this.props.username + '-untouched2-' + this.props.untouched_hand[2]} number={this.props.untouched_hand[2]}/>
                            <Card clickable={true} clickFunct={() => {this.playHiddenHandler(0)}} float={true} blank={this.props.hidden_hand[0]} faceDown={!this.props.hidden_hand[0]} key={this.props.username + '-hidden0-' + this.props.hidden_hand[0]}/>
                            <Card clickable={true} clickFunct={() => {this.playHiddenHandler(1)}} float={true} blank={this.props.hidden_hand[1]} faceDown={!this.props.hidden_hand[1]} key={this.props.username + '-hidden1-' + this.props.hidden_hand[1]}/>
                            <Card clickable={true} clickFunct={() => {this.playHiddenHandler(2)}} float={true} blank={this.props.hidden_hand[2]} faceDown={!this.props.hidden_hand[2]} key={this.props.username + '-hidden2-' + this.props.hidden_hand[2]}/>
                        </>
                    );
                } else {
                    return (
                        <>
                            <Card float={true} fromUntouched={true} blank={untouched_hand[0] === -1} key={player + '-untouched-0'} number={untouched_hand[0]}/>
                            <Card float={true} fromUntouched={true} blank={untouched_hand[1] === -1} key={player + '-untouched-1'} number={untouched_hand[1]}/>
                            <Card float={true} fromUntouched={true} blank={untouched_hand[2] === -1} key={player + '-untouched-2'} number={untouched_hand[2]}/>
                            <Card float={true} blank={hidden_hand[0]} faceDown={!hidden_hand[0]} key={player + '-hidden-0'}/>
                            <Card float={true} blank={hidden_hand[1]} faceDown={!hidden_hand[1]} key={player + '-hidden-1'}/>
                            <Card float={true} blank={hidden_hand[2]} faceDown={!hidden_hand[2]} key={player + '-hidden-2'}/>
                        </>
                    );
                }
                
            });
            //Look for this player's position in the list
            let playerIndex;
            for (playerIndex = 0; playerIndex < this.props.player_names.length; playerIndex++) {
                if (this.props.player_names[playerIndex] === this.props.username) {
                    break;
                }
            }


            hand = this.props.hand.map((card) => {
                return (<Card highlight={this.state.swapPhase} clickable={true} float={true} playCard={this.cardPlayHandler} fromUntouched={false} key={card} number={card}/>)
            });

            playerNames = [
                ...(playerNames.slice(playerIndex, playerNames.length)),
                ...(playerNames.slice(0, playerIndex))
            ]

            playerNumCards = [
                ...(playerNumCards.slice(playerIndex, playerNumCards.length)),
                ...(playerNumCards.slice(0, playerIndex))
            ]

            playerSwapped = [
                ...(playerSwapped.slice(playerIndex, playerSwapped.length)),
                ...(playerSwapped.slice(0, playerIndex))
            ]

            playerCards = [
                ...(playerCards.slice(playerIndex, playerCards.length)),
                ...(playerCards.slice(0, playerIndex))
            ]
        }

        if (this.props.players.length === 2) {
            return (
                <Container className="p-3">
                    <Popup open={this.state.popUp} onClose={this.closePopUp} modal closeOnDocumentClick>
                        <div>{this.state.popUpMsg}</div>
                    </Popup>
                    <Container>
                        <Row><hr></hr></Row>
                        <Row>
                            <Col></Col>
                            <Col>
                                {this.formatPlayerDisplay(playerNames[1], playerCards[1], playerNumCards[1], playerSwapped[1])}
                            </Col>
                            <Col>{this.formatHelpButtonDisplay()}</Col>
                        </Row>
                        <Row><hr></hr></Row>
                        <Row><hr></hr></Row>
                        <Row><hr></hr></Row>
                        <Row>
                            <Col>
                                <hr className="hidden-line"></hr>
                                <hr className="hidden-line"></hr>
                                <hr className="hidden-line"></hr>
                                <hr className="hidden-line"></hr>
                                <hr className="hidden-line"></hr>
                                {
                                    this.state.swapPhase ? 
                                    (<Button className="swap-btn" onClick={this.lockInHandler} variant="secondary">Lock In</Button>):
                                    null
                                }
                                {
                                    this.state.swapPhase ? 
                                    (<Button className="swap-btn" onClick={this.swapCardHandler} variant="secondary">Swap</Button>):
                                    null
                                }
                            </Col>
                            <Col>
                                {this.formatCenterDisplay()}
                                {this.formatPlayerDisplay(playerNames[0], playerCards[0])}
                                <hr className="hidden-line"></hr>
                                <hr className="hidden-line"></hr>
                                {hand}
                            </Col>
                            <Col>
                                <hr className="hidden-line"></hr>
                                <hr className="hidden-line"></hr>
                                <hr className="hidden-line"></hr>
                                {this.formatChatBoxDisplay()}
                            </Col>
                        </Row>
                        <Row>
                            <hr></hr>
                        </Row>
                    </Container>
                </Container>
            )
        } else if (this.props.players.length === 3) {
            return (
                <Container className="p-3">
                    <Popup open={this.state.popUp} onClose={this.closePopUp} modal closeOnDocumentClick>
                        <div>{this.state.popUpMsg}</div>
                    </Popup>
                    <Container>
                        <Row><hr></hr></Row>
                        <Row>
                            <Col></Col>
                            <Col>
                                {this.formatPlayerDisplay(playerNames[2], playerCards[2], playerNumCards[2], playerSwapped[2])}
                            </Col>
                            <Col>{this.formatHelpButtonDisplay()}</Col>
                        </Row>
                        <Row><hr></hr></Row>
                        <Row><hr></hr></Row>
                        <Row><hr></hr></Row>
                        <Row>
                            <Col>
                                {this.formatPlayerDisplay(playerNames[1], playerCards[1], playerNumCards[1], playerSwapped[1])}
                                <hr className="hidden-line"></hr>
                                {
                                    this.state.swapPhase ? 
                                    (<Button className="swap-btn" onClick={this.lockInHandler} variant="secondary">Lock In</Button>):
                                    null
                                }
                                {
                                    this.state.swapPhase ? 
                                    (<Button className="swap-btn" onClick={this.swapCardHandler} variant="secondary">Swap</Button>):
                                    null
                                }
                            </Col>
                            <Col>
                                {this.formatCenterDisplay()}
                                {this.formatPlayerDisplay(playerNames[0], playerCards[0])}
                                <hr className="hidden-line"></hr>
                                <hr className="hidden-line"></hr>
                                {hand}
                            </Col>
                            <Col>
                                <hr className="hidden-line"></hr>
                                <hr className="hidden-line"></hr>
                                <hr className="hidden-line"></hr>
                                {this.formatChatBoxDisplay()}
                            </Col>
                        </Row>
                        <Row>
                            <hr></hr>
                        </Row>
                    </Container>
                </Container>
            )
        } else if (this.props.players.length === 4) {
            return (
                <Container className="p-3">
                    <Popup open={this.state.popUp} onClose={this.closePopUp} modal closeOnDocumentClick>
                        <div>{this.state.popUpMsg}</div>
                    </Popup>
                    <Container>
                        <Row><hr></hr></Row>
                        <Row>
                            <Col></Col>
                            <Col>
                                {this.formatPlayerDisplay(playerNames[2], playerCards[2], playerNumCards[2], playerSwapped[2])}
                            </Col>
                            <Col>{this.formatHelpButtonDisplay()}</Col>
                        </Row>
                        <Row><hr></hr></Row>
                        <Row><hr></hr></Row>
                        <Row><hr></hr></Row>
                        <Row>
                            <Col>
                                {this.formatPlayerDisplay(playerNames[1], playerCards[1], playerNumCards[1], playerSwapped[1])}
                                <hr className="hidden-line"></hr>
                                {
                                    this.state.swapPhase ? 
                                    (<Button className="swap-btn" onClick={this.lockInHandler} variant="secondary">Lock In</Button>):
                                    null
                                }
                                {
                                    this.state.swapPhase ? 
                                    (<Button className="swap-btn" onClick={this.swapCardHandler} variant="secondary">Swap</Button>):
                                    null
                                }
                            </Col>
                            <Col>
                                {this.formatCenterDisplay()}
                                {this.formatPlayerDisplay(playerNames[0], playerCards[0])}
                                <hr className="hidden-line"></hr>
                                <hr className="hidden-line"></hr>
                                {hand}
                            </Col>
                            <Col>
                                {this.formatPlayerDisplay(playerNames[3], playerCards[3], playerNumCards[3], playerSwapped[3])}
                                <hr className="hidden-line"></hr>
                                {this.formatChatBoxDisplay()}
                            </Col>
                        </Row>
                        <Row>
                            <hr></hr>
                        </Row>
                    </Container>
                </Container>
            )
        } else {
            this.displayInactivityMessage();
            return (
                <div>Hello.</div>
            )
        }

        
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
        player_swapped : state.player_swapped,
        player_num_cards : state.player_num_cards,
        deck : state.deck,
        played_pile : state.played_pile,
        discard_pile : state.discard_pile,
        hand : state.hand,
        untouched_hand : state.untouched_hand,
        hidden_hand : state.hidden_hand,
        playable_cards : state.playable_cards,
        turn_at : state.turn_at,
        messages : state.messages
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
        updateHand: (hand) => {dispatch({type: 'UPDATE_HAND', hand: hand})},
        updateUntouchedHand: (untouched_hand) => {dispatch({type: 'UPDATE_UNTOUCHED_HAND', untouched_hand: untouched_hand})},
        updateHiddenHand: (hidden_hand) => {dispatch({type: 'UPDATE_HIDDEN_HAND', hidden_hand: hidden_hand})},
        updateCenter: (center_state) => {dispatch({type: 'UPDATE_CENTER', center_state: center_state} )},
        updatePlayableCards: (playable_cards) => {dispatch({type: 'UPDATE_PLAYABLE_CARDS', playable_cards: playable_cards})},
        updateTurnAt: (turn_at) => {dispatch({type: 'UPDATE_TURN_AT', turn_at: turn_at})},
        resetState: () => {dispatch({type: 'RESET_STATE'})},
        updateMessages: (messages) => {dispatch({type: 'UPDATE_MESSAGES', messages: messages})}

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Game); 