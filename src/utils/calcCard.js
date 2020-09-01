export const calcCard = (card) => {
    let cardNumber = (card % 13).toString();
    let suit = Math.floor((card - 1) / 13);
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

    return cardNumber + " " + icon;
 }