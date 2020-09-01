import React, {useState} from 'react';

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


    if (props.faceDown) {
        return (
            <div onClick={clickHandler} className={"card " + float + " " + click + " " + (highlight && props.clickable ? "highlight" : null)}>X</div>
        )
    } else if (props.blank) {
        return (
            <div onClick={clickHandler} className={"card " + float + " " + click + " " + (highlight && props.clickable ? "highlight" : null)}></div>
        )
    } else {
        return (
            <div onClick={clickHandler} className={"card " + float + " " + click + " " + (highlight && props.clickable ? "highlight" : null)}>{cardNumber} {icon}</div>
        )
    }

}

