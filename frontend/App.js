import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StackNavigator } from 'react-navigation'; // Version can be specified in package.json
import Login from './app/components/Login';
import MainMenu from './app/components/MainMenu';
import GameSearch from './app/components/GameSearch';
import RegisterPage from './app/components/RegisterPage';
import GameScreen from './app/components/GameScreen';
import GameOver from './app/components/GameOver';

const Application = StackNavigator(
    {
        Home: {
            screen: Login
        },
        MainMenu: {
            screen: MainMenu
        },
        GameSearch: {
            screen: GameSearch
        },
        RegisterPage: {
            screen: RegisterPage
        },
        GameScreen:{
            screen: GameScreen
        },
        GameOver:{
            screen: GameOver
        },
    },  
    {
        navigationOptions: {
            header: false,
    }
        
});

export default class App extends React.Component {
    render(){
        return(
            <Application />
        );
    }   
}