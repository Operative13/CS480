import React from 'react';
import { StyleSheet, Text, View, TextInput, KeyboardAvoidingView, TouchableOpacity, AsyncStorage, Keyboard } from 'react-native';
import { StackNavigator } from 'react-navigation'; // Version can be specified in package.json

import BaseConnection from 'kingdoms-game-sdk/src/BaseConnection';
import User from 'kingdoms-game-sdk/src/User';

import IP from '../../config';

export default class Login extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            username: '',
            password: '',
        }
    }


    //functions to skip login screen
    componentDidMount(){
        this._loadInitialState().done();
    }

    _loadInitialState = async () => {

        var value = await AsyncStorage.getItem('_id');
        if (value != null){
            this.props.navigation.navigate('MainMenu');
        }
    }

    render(){
        return(
            <KeyboardAvoidingView behavior='padding' style={styles.wrapper}>

                <View style={styles.container}>
                    <Text style={styles.header}> - LOGIN - </Text>

                    <TextInput
                        style={styles.textInput} placeholder='Username'
                        onChangeText={ (username) => this.setState({username})}
                        underlineColorAndroid='transparent'
                    />
                    <TextInput
                        secureTextEntry = {true}
                        style={styles.textInput} placeholder='Password'
                        onChangeText={ (password) => this.setState({password})}
                        underlineColorAndroid='transparent'
                    />

                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => this.login(this.state.username,this.state.password) }
                    >
                        <Text>Log in</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => this.props.navigation.navigate('RegisterPage')}
                    >
                        <Text>Register</Text>
                    </TouchableOpacity>

                </View>

            </KeyboardAvoidingView>
        );
    }


    //function to login user and store user to async for faster login
    login = (userString, passString) => {

        let baseConn = new BaseConnection( IP,'3000');
        let u = new User(baseConn);

        u.login(userString, passString)
            .then((res) => {
                if(res.username != userString) {throw res}
                AsyncStorage.setItem('_id',res._id);
                Keyboard.dismiss();
                this.props.navigation.navigate('MainMenu');
            })
            .catch((err) => {
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
        marginBottom: 20,
        backgroundColor: '#fff',
    },
    btn: {
        alignSelf: 'stretch',
        backgroundColor: '#01c853',
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
    }
});