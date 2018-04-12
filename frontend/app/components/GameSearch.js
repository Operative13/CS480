import React from 'react';
import {StyleSheet, Text, View, TextInput, KeyboardAvoidingView, TouchableOpacity, Keyboard} from 'react-native';
import { StackNavigator } from 'react-navigation'; // Version can be specified in package.json


export default class GameSearch extends React.Component {
    
    constructor(props){
        super(props);
        this.state = {
            newRoomName: '',
            joinRoomName: '',
            joinUserName: ''
        }
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
                        onPress={this.createRoom}
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
                        onPress={ this.joinRoomByName}
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
                        onPress={this.joinRoomByUser}
                    >
                        <Text>Join Username</Text>
                    </TouchableOpacity>
                        
                    
                    
                </View>
            
            </KeyboardAvoidingView>
        );
    }   
    
    createRoom = () => {
        //alert('creating room');
        Keyboard.dismiss();
        this.props.navigation.navigate('GameScreen');
    }
    
    joinRoomByName = () => {
        //alert('joining by room name');
        Keyboard.dismiss();
        this.props.navigation.navigate('GameScreen');
    }
    
    joinRoomByUser = () => {
        //alert('join by user name');
        Keyboard.dismiss();
        this.props.navigation.navigate('GameScreen');
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