import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    KeyboardAvoidingView,
    TouchableOpacity,
    AsyncStorage,
    Keyboard
} from 'react-native';
import { StackNavigator } from 'react-navigation'; // Version can be specified in package.json

import BaseConnection from 'kingdoms-game-sdk/BaseConnection';
import User from 'kingdoms-game-sdk/User';

import IP from '../../config';

export default class RegisterPage extends React.Component {
    
    constructor(props){
        super(props);
        this.state = {
            username: '',
            password: '',
            email: ''
        }
    }
 
    render(){
        return(
            <KeyboardAvoidingView behavior='padding' style={styles.wrapper}>
            
                <View style={styles.container}>
                    <Text style={styles.header}> - Register - </Text>
                    
                    <TextInput
                        style={styles.textInput} placeholder='Email'
                        onChangeText={ (email) => this.setState({email})}
                        underlineColorAndroid='transparent'
                    />
                    <TextInput
                        style={styles.textInput} placeholder='Username'
                        onChangeText={ (username) => this.setState({username})}
                        underlineColorAndroid='transparent'
                    />
                    <TextInput
                        style={styles.textInput} placeholder='Password'
                        onChangeText={ (password) => this.setState({password})}
                        underlineColorAndroid='transparent'
                    />
                                      
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => this.register(this.state.username,this.state.password,this.state.email)}
                    >
                        <Text>Register</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => this.props.navigation.goBack()}
                    >
                        <Text>Cancel</Text>
                    </TouchableOpacity>
                    
                </View>
            
            </KeyboardAvoidingView>
        );
    }

    //function that handles attempt to register an account after button press
    register = (userString, passString, emailString) => {
        let baseConn = new BaseConnection( IP ,'3000');
        let u = new User(baseConn);

        u.create(userString, passString, emailString)
            .then((res) => {
                if(res.username != userString) {throw res}
                alert('Successful account creation');
                Keyboard.dismiss();
                this.props.navigation.goBack();
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