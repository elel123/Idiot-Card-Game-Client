import React, { useEffect } from 'react';
import {Route, BrowserRouter, Switch} from 'react-router-dom';
import Home from './components/Home';
import Lobby from './components/Lobby';
import Game from './components/Game';
import ReactGA from 'react-ga';



function App() {

    useEffect(() => {
        ReactGA.initialize('G-VW4EDEPNS7');
        console.log("welcome");
        ReactGA.pageview(window.location.pathname + window.location.search);
    }, []);

    return (
        <BrowserRouter>
            <link
            rel="stylesheet"
            href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css"
            integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk"
            crossOrigin="anonymous"
            />
            <link href="https://fonts.googleapis.com/css2?family=Balsamiq+Sans&display=swap" rel="stylesheet"></link>
            <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans&display=swap" rel="stylesheet"></link>
            <div className="App">
                <Switch>
                    <Route exact path='/' component={Home}/>
                    <Route path='/lobby' component={Lobby}/>
                    <Route path='/game' component={Game}/>
                </Switch>
            </div>
        </BrowserRouter>
    );
}

export default App;
