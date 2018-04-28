import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    KeyboardAvoidingView,
    TouchableOpacity,
    Keyboard,
    AsyncStorage,
} from 'react-native';
import { StackNavigator } from 'react-navigation'; // Version can be specified in package.json

import BaseConnection from 'kingdoms-game-sdk/src/BaseConnection';
import Game from 'kingdoms-game-sdk/src/Game';

import IP from '../../config';

export default class GameSearch extends React.Component {
    
    constructor(props){
        super(props);
        this.state = {
            newRoomName: '',
            joinRoomName: '',
            joinUserName: '',
            userID: null,
            lat: null,
            lon: null,
            error: null,
        }

        let baseConn = new BaseConnection( IP ,'3000');
        this.game = new Game(baseConn);
    }

    componentDidMount(){
        this._loadInitialState().done();
    }

    _loadInitialState = async () => {

        //get id
        let value = await AsyncStorage.getItem('_id');
        //return to menu on error
        if (value == null){
            alert('error getting user ID');
            this.props.navigation.pop(1);
        }
        this.state.userID = value;
        //get location
        this.getGeolocation();
        //return to menu on error
        if(this.state.error != null){
            alert(this.state.error);
            this.props.navigation.pop(1);
        }

        //attempt to leave a game whether or not the user is actually in a game
        let gameID = await AsyncStorage.getItem('gameID');
        if(gameID != null){
            this.game.leave(this.state.userID, gameID)
                .then((response) => {

                })
                .catch((error) => {
                    alert('leave game: ' + error.message)
                })
            AsyncStorage.removeItem('gameID');
        }
    }

    getGeolocation() {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.setState({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    error: null,
                });
            },
            (error) => this.setState({ error: error.message }),
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
        );
    }
    
    render(){
        return(
            <KeyboardAvoidingView behavior='padding' style={styles.wrapper}>
            
                <View style={styles.container}>
                    <Text style={styles.header}> - Lobby - </Text>
                    
                    <TextInput
                        style={styles.textInput} placeholder='New Room Name'
                        onChangeText={ (newRoomName) => this.setState({newRoomName})}
                        underlineColorAndroid='transparent'
                    />
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => this.createRoom(this.state.newRoomName)}
                    >
                        <Text>Create New Room</Text>
                    </TouchableOpacity>
                    
                    <TextInput
                        style={styles.textInput} placeholder='Join Room Name'
                        onChangeText={ (joinRoomName) => this.setState({joinRoomName})}
                        underlineColorAndroid='transparent'
                    />
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={ () => this.joinRoomByName(this.state.joinRoomName)}
                    >
                        <Text>Join Room Name</Text>
                    </TouchableOpacity>
                    
                    <TextInput
                        style={styles.textInput} placeholder='Join Username'
                        onChangeText={ (joinUserName) => this.setState({joinUserName})}
                        underlineColorAndroid='transparent'
                    />
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => this.joinRoomByUser(this.state.joinUserName)}
                    >
                        <Text>Join Username</Text>
                    </TouchableOpacity>
                        
                    
                    
                </View>
            
            </KeyboardAvoidingView>
        );
    }   
    
    createRoom = (roomName) => {
        //alert('creating room');

        this.game.create(roomName,this.state.userID,this.state.lat,this.state.lon,true)
            .then((res) => {
                //if(res.name != roomName) {throw res};
                //alert(res._id);
                Keyboard.dismiss();
                AsyncStorage.setItem('gameID', res._id);
                this.props.navigation.navigate('GameScreen', {gameID: res._id, lat: this.state.lat, lon: this.state.lon,});
            })
            .catch((err) => {
                Keyboard.dismiss();
                alert('create room ' + err);
            });


    }
    
    joinRoomByName = (gameName) => {
        //alert('joining by room name');

        this.game.join(this.state.userID, gameName)
            .then((res) => {
                //if(res.gameName != gameName) {throw res};
                Keyboard.dismiss();
                AsyncStorage.setItem('gameID', res._id);
                this.props.navigation.navigate('GameScreen', {gameID: res._id, lat: this.state.lat, lon: this.state.lon,});
            })
            .catch((err) => {
                Keyboard.dismiss();
                alert(err);
            });

    }
    
    joinRoomByUser = (joinUserName) => {
        //alert('join by user name');

        this.game.join(this.state.userID, null, joinUserName)
            .then((res) => {
                //if(res.username != joinUserName) {throw res};
                Keyboard.dismiss();
                AsyncStorage.setItem('gameID', res._id);
                this.props.navigation.navigate('GameScreen', {gameID: res._id, lat: this.state.lat, lon: this.state.lon,});
            })
            .catch((err) => {
                Keyboard.dismiss();
                alert(err);
            });

    }
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2896d3',
        paddingLeft: 40,
        paddingRight: 40,
    },
    header: {
        fontSize: 24,
        marginBottom: 60,
        color: '#fff',
        fontWeight: 'bold',
    },
    textInput: {
        alignSelf: 'stretch',
        padding: 16,
        marginBottom: 10,
        backgroundColor: '#fff',
    },
    btn: {
        alignSelf: 'stretch',
        backgroundColor: '#01c853',
        padding: 10,
        alignItems: 'center',
        marginBottom: 20,
    }
});