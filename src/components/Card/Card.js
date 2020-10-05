import React, {useState} from 'react';
import shiba from './shiba.png';
import idiot from './idiot.png';
import classic from './classic.png';
import pokemon from './pokemon.png';

import './Card.css';

export const Card = (props) => {
    const [highlight, setHighlight] = useState(false);
    const toggleHighlight = e => setHighlight(!highlight);

    const clickHandler = () => {
        if (props.playCard) {
            props.playCard(props.number, (props.fromUntouched));
        } else if (props.clickFunct) {
            props.clickFunct();
        }
        if (props.highlight) {
            toggleHighlight();
        } else {
            setHighlight(false);
        }
    }

    const mouseOverHandler = () => {
        if (!props.highlight) {
            setHighlight(false);
        }
    }

    let cardNumber = (props.number % 13).toString();
    let float = props.float ? "float" : null;
    let click = props.clickable ? "pointer" : null;
    let suit = Math.floor((props.number - 1) / 13);
    let icon = '';
    if (suit === 0) {
        icon = '♦';
    } else if (suit === 1) {
        icon = '♣';
    } else if (suit === 2) {
        icon = '♥';
    } else {
        icon = '♠';
    }

    if (cardNumber === '11') {
        cardNumber = 'J';
    } else if (cardNumber === '12') {
        cardNumber = 'Q';
    } else if (cardNumber === '0') {
        cardNumber = 'K';
    } else if (cardNumber === '1') {
        cardNumber = 'A';
    }

    if (props.blank) {
        return (
            <div onClick={clickHandler} className={"card " + float + " " + click + " " + (highlight && props.clickable ? "highlight" : null)}></div>
        )
    } else if (props.faceDown) {
        let cardBack;

        if (props.cardBack === "Shiba-Inu") {
            cardBack = shiba;
        } else if (props.cardBack === "Idiot") {
            cardBack = idiot;
        } else if (props.cardBack === "Pokemon") { 
            cardBack = pokemon;
        } else {
            cardBack = classic;
        }

        return (
            <div onClick={clickHandler} className={"card back " + float + " " + click + " " + (highlight && props.clickable ? "highlight" : null)}>
                <img src={cardBack} width="38" height="50"></img>
            </div>
        )
    } else {
        return (
            <div onClick={clickHandler} onMouseOver={mouseOverHandler} className={"card " + float + " " + click + " " + (highlight && props.clickable ? "highlight" : null)}>{cardNumber} {icon}</div>
        )
    }

}

